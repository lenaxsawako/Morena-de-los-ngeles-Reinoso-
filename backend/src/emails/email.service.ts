import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { Email, EmailDocument, EmailStatus, EmailTemplate } from '../models/email.schema';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';
import { EMAIL_MODEL } from '../models';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isEnabled = false;
  private smtpConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    senderEmail: string;
  } | null = null;

  constructor(
    @InjectModel(EMAIL_MODEL) private emailModel: Model<EmailDocument>,
    @InjectModel(SiteConfig.name) private siteConfigModel: Model<SiteConfigDocument>,
  ) {}

  async onModuleInit() {
    // Cargar configuración SMTP de BD al iniciar la aplicación
    await this.loadSmtpConfigFromDatabase();
  }

  /**
   * Carga configuración SMTP desde BD al iniciar
   */
  private async loadSmtpConfigFromDatabase() {
    try {
      this.logger.log('Loading SMTP configuration from database...');
      const config = await this.siteConfigModel
        .findOne()
        .select('+smtp')
        .lean()
        .exec();

      if (config?.smtp) {
        this.updateSmtpConfig(config.smtp);
      } else {
        this.logger.warn('No SMTP configuration found in database - email service disabled');
        this.isEnabled = false;
      }
    } catch (error) {
      this.logger.error(`Error loading SMTP config from database: ${error.message}`);
      this.isEnabled = false;
      this.transporter = null;
    }
  }

  /**
   * Actualiza configuración SMTP y recrea el transporter
   */
  public updateSmtpConfig(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    senderEmail: string;
  }) {
    // Validar que al menos los campos esenciales estén presentes
    if (!config.host || !config.user || !config.password || !config.senderEmail) {
      this.logger.warn('SMTP configuration incomplete - disabling email service');
      this.isEnabled = false;
      this.transporter = null;
      this.smtpConfig = null;
      return;
    }

    this.smtpConfig = config;

    try {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port || 587,
        secure: config.port === 465, // Use TLS if port 465
        auth: {
          user: config.user,
          pass: config.password,
        },
      });

      this.isEnabled = true;
      this.logger.log(
        `SMTP configured and ready: ${config.user}@${config.host}:${config.port}`,
      );
    } catch (error) {
      this.logger.error(`Error creating SMTP transporter: ${error.message}`);
      this.isEnabled = false;
      this.transporter = null;
    }
  }

  /**
   * Event listener: Se activa cuando la configuración SMTP cambia
   */
  @OnEvent('settings.smtp.updated')
  handleSmtpConfigUpdate(payload: {
    host: string;
    port: number;
    user: string;
    password: string;
    senderEmail: string;
  }) {
    this.logger.log('SMTP configuration updated via event');
    this.updateSmtpConfig(payload);
  }

  async sendEmail(
    recipient: string,
    subject: string,
    body: string,
    htmlBody?: string,
    template: EmailTemplate = EmailTemplate.CUSTOM,
    metadata?: Record<string, unknown>,
  ): Promise<EmailDocument> {
    try {
      // Guardar en BD con estado pending
      const email = await this.emailModel.create({
        recipient,
        subject,
        body,
        htmlBody: htmlBody || body,
        status: EmailStatus.PENDING,
        template,
        metadata: metadata || {},
      });

      // Intentar enviar solo si el servicio está habilitado
      if (this.isEnabled) {
        await this.send(email._id.toString());
      } else {
        this.logger.warn(
          `Email ${email._id} queued but not sent: SMTP service not configured`,
        );
      }

      return email;
    } catch (error) {
      this.logger.error(`Error creating email: ${error.message}`);
      throw error;
    }
  }

  async send(emailId: string): Promise<void> {
    try {
      if (!this.isEnabled || !this.transporter) {
        throw new Error('SMTP service is not configured');
      }

      const email = await this.emailModel.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      if (email.status === EmailStatus.SENT) {
        this.logger.warn(`Email ${emailId} already sent`);
        return;
      }

      const info = await this.transporter.sendMail({
        from: this.smtpConfig?.senderEmail || 'noreply@example.com',
        to: email.recipient,
        subject: email.subject,
        text: email.body,
        html: email.htmlBody,
      });

      // Actualizar estado a enviado
      await this.emailModel.findByIdAndUpdate(
        emailId,
        {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          attempts: email.attempts + 1,
          metadata: {
            ...email.metadata,
            messageId: info.messageId,
            response: info.response,
          },
        },
        { new: true },
      );

      this.logger.log(`Email sent successfully: ${info.messageId}`);
    } catch (error) {
      const email = await this.emailModel.findById(emailId);
      if (!email) {
        this.logger.error(`Email ${emailId} not found when handling error`);
        return;
      }

      // Actualizar con error
      await this.emailModel.findByIdAndUpdate(
        emailId,
        {
          status: EmailStatus.FAILED,
          attempts: email.attempts + 1,
          failedReason: error.message,
        },
        { new: true },
      );

      this.logger.error(`Error sending email ${emailId}: ${error.message}`);
    }
  }

  async getPendingEmails(): Promise<EmailDocument[]> {
    return this.emailModel
      .find({ status: EmailStatus.PENDING })
      .sort({ createdAt: 1 })
      .exec();
  }

  async retryFailedEmails(maxAttempts: number = 3): Promise<void> {
    try {
      const failedEmails = await this.emailModel.find({
        status: EmailStatus.FAILED,
        attempts: { $lt: maxAttempts },
      });

      for (const email of failedEmails) {
        await this.send(email._id.toString());
      }

      this.logger.log(`Retried ${failedEmails.length} failed emails`);
    } catch (error) {
      this.logger.error(`Error retrying failed emails: ${error.message}`);
    }
  }

  async findAll(
    status?: EmailStatus,
    limit: number = 50,
    skip: number = 0,
  ): Promise<{ data: EmailDocument[]; total: number }> {
    const query = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.emailModel.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).exec(),
      this.emailModel.countDocuments(query),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<EmailDocument | null> {
    return this.emailModel.findById(id).exec();
  }

  async markAsRead(id: string): Promise<EmailDocument | null> {
    return this.emailModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true },
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await this.emailModel.findByIdAndDelete(id).exec();
  }

  async deleteAll(status?: EmailStatus): Promise<{ deletedCount: number }> {
    const query = status ? { status } : {};
    const result = await this.emailModel.deleteMany(query);
    return { deletedCount: result.deletedCount };
  }

  async getStatistics(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    const [total, sent, failed, pending] = await Promise.all([
      this.emailModel.countDocuments(),
      this.emailModel.countDocuments({ status: EmailStatus.SENT }),
      this.emailModel.countDocuments({ status: EmailStatus.FAILED }),
      this.emailModel.countDocuments({ status: EmailStatus.PENDING }),
    ]);

    return { total, sent, failed, pending };
  }

  /**
   * Obtiene el estado actual del servicio de email
   */
  getEmailServiceStatus(): {
    enabled: boolean;
    configured: boolean;
    config?: {
      host: string;
      port: number;
      user: string;
      senderEmail: string;
    };
  } {
    return {
      enabled: this.isEnabled,
      configured: !!this.smtpConfig,
      config: this.smtpConfig
        ? {
            host: this.smtpConfig.host,
            port: this.smtpConfig.port,
            user: this.smtpConfig.user,
            senderEmail: this.smtpConfig.senderEmail,
          }
        : undefined,
    };
  }
}
