import { Injectable } from '@nestjs/common';
import { EmailService } from '../emails/email.service';
import { TemplateService } from './template.service';

@Injectable()
export class TransactionalService {
  constructor(
    private emailService: EmailService,
    private templateService: TemplateService,
  ) {}

  async sendWelcome(email: string, name: string) {
    const baseUrl = this.templateService.getBaseUrl();
    const content = `
      <p>¡Bienvenida, ${name}!</p>
      <p>Ya forms parte de nuestra comunidad. Acá podés descubrir nuevas obras, seguir a tus autores favoritos y llevar la lectura a donde vayas.</p>
      <p>Explorá el catálogo y encuentra tu próxima historia.</p>
    `;
    const html = this.templateService.render({
      site_name: process.env.SITE_NAME || 'LBB',
      subject: `Bienvenida, ${name} 👋`,
      content,
      unsubscribe_url: this.templateService.buildUnsubscribeUrl(email),
    }, { url: `${baseUrl}/catalog`, text: 'EXPLORAR CATÁLOGO' });
    await this.emailService.sendEmail(email, `Bienvenida, ${name} 👋`, content, html);
  }

  async sendPurchaseConfirmation(email: string, bookTitle: string, bookId: string, orderNumber: string, amount: string, coverUrl?: string) {
    const baseUrl = this.templateService.getBaseUrl();
    const content = `
      <p>¡Gracias por tu compra!</p>
      <p><strong>${bookTitle}</strong> ya está disponible en tu biblioteca.</p>
      ${coverUrl ? `<p><img src="${coverUrl}" alt="${bookTitle}" style="max-width:200px;border-radius:8px;" /></p>` : ''}
      <p style="font-size:14px;color:rgba(255,255,255,0.6);margin-top:20px;">
        Orden: ${orderNumber}<br/>
        Monto: ${amount}
      </p>
    `;
    const html = this.templateService.render({
      site_name: process.env.SITE_NAME || 'LBB',
      subject: `Tu compra de ${bookTitle} fue confirmada`,
      content,
      unsubscribe_url: this.templateService.buildUnsubscribeUrl(email),
    }, { url: `${baseUrl}/chapter/${bookId}`, text: 'LEER AHORA' });
    await this.emailService.sendEmail(email, `Tu compra de ${bookTitle} fue confirmada`, content, html);
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    const content = `
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>Hacé click en el siguiente enlace para crear una nueva contraseña. Este enlace expira en 1 hora.</p>
      <p style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:20px;">
        Si no solicitaste este cambio, ignorá este correo.
      </p>
    `;
    const html = this.templateService.render({
      site_name: process.env.SITE_NAME || 'LBB',
      subject: 'Recuperá tu contraseña',
      content,
      unsubscribe_url: '',
    }, { url: resetUrl, text: 'RESTABLECER CONTRASEÑA' });

    const plain = `Recibimos una solicitud para restablecer tu contraseña. Usá este enlace: ${resetUrl}. Expira en 1 hora.`;
    await this.emailService.sendEmail(email, 'Recuperá tu contraseña', plain, html);
  }

  async sendReadingReminder(email: string, name: string, bookTitle: string, bookId: string, progressPercentage: number, coverUrl?: string) {
    const baseUrl = this.templateService.getBaseUrl();
    const content = `
      <p>¡Hola, ${name}!</p>
      <p>Hace unos días adquiriste <strong>${bookTitle}</strong> y notamos que aún no seguís leyendo.</p>
      ${coverUrl ? `<p><img src="${coverUrl}" alt="${bookTitle}" style="max-width:200px;border-radius:8px;" /></p>` : ''}
      <p>Llevás el <strong>${progressPercentage}%</strong> del libro. ¡Continuá donde lo dejaste!</p>
    `;
    const html = this.templateService.render({
      site_name: process.env.SITE_NAME || 'LBB',
      subject: `¿Seguís leyendo ${bookTitle}?`,
      content,
      unsubscribe_url: this.templateService.buildUnsubscribeUrl(email),
    }, { url: `${baseUrl}/chapter/${bookId}`, text: 'CONTINUAR LEYENDO' });
    await this.emailService.sendEmail(email, `¿Seguís leyendo ${bookTitle}?`, content, html);
  }

  async sendTicketConfirmation(email: string, name: string, ticketId: string) {
    const content = `
      <p>Hola, ${name}.</p>
      <p>Recibimos tu mensaje. Te responderemos a la brevedad a este email.</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);margin-top:20px;">
        Número de referencia: <strong>#${ticketId}</strong>
      </p>
    `;
    const html = this.templateService.render({
      site_name: process.env.SITE_NAME || 'LBB',
      subject: `Recibimos tu consulta (#${ticketId})`,
      content,
      unsubscribe_url: '',
    });
    await this.emailService.sendEmail(email, `Recibimos tu consulta (#${ticketId})`, content, html);
  }

  async sendTicketReply(email: string, name: string, ticketId: string, adminReply: string) {
    const content = `
      <p>Hola, ${name}.</p>
      <p>Recibiste una respuesta a tu consulta <strong>#${ticketId}</strong>:</p>
      <div style="background:rgba(255,255,255,0.05);border-left:3px solid #F3EAD3;padding:1rem;margin:1rem 0;border-radius:4px;">
        ${adminReply}
      </div>
      <p>Si necesitás más ayuda, no dudes en responder a este correo.</p>
    `;
    const html = this.templateService.render({
      site_name: process.env.SITE_NAME || 'LBB',
      subject: `Respuesta a tu consulta (#${ticketId})`,
      content,
      unsubscribe_url: '',
    });
    await this.emailService.sendEmail(email, `Respuesta a tu consulta (#${ticketId})`, content, html);
  }
}
