import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';

export interface TemplateVars {
  site_name?: string;
  subject: string;
  content: string;
  unsubscribe_url: string;
}

const DEFAULT_LAYOUT = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: Georgia, 'Times New Roman', serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding: 30px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .header h1 { color: #F3EAD3; font-size: 24px; margin: 0; font-weight: 400; letter-spacing: 2px; }
    .content { padding: 30px 0; color: #e5e2e1; font-size: 16px; line-height: 1.8; }
    .content p { margin: 0 0 16px; }
    .cta { text-align: center; padding: 20px 0; }
    .cta a { display: inline-block; padding: 14px 36px; background-color: #F3EAD3; color: #0a0a0a; text-decoration: none; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
    .footer { text-align: center; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: rgba(255,255,255,0.4); }
    .footer a { color: rgba(255,255,255,0.6); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{site_name}}</h1>
    </div>
    <div class="content">
      {{content}}
    </div>
    {{#cta}}
    <div class="cta">
      <a href="{{cta_url}}">{{cta_text}}</a>
    </div>
    {{/cta}}
    <div class="footer">
      <p>Si no deseas recibir más correos, puedes <a href="{{unsubscribe_url}}">cancelar tu suscripción</a>.</p>
    </div>
  </div>
</body>
</html>`;

@Injectable()
export class TemplateService implements OnModuleInit {
  private readonly logger = new Logger(TemplateService.name);
  private siteName = 'LBB';
  private readonly baseUrl: string;

  constructor(
    @InjectModel(SiteConfig.name) private siteConfigModel: Model<SiteConfigDocument>,
  ) {
    this.baseUrl = process.env.FRONTEND_URL || process.env.VITE_API_URL?.replace('/api', '') || 'https://lbb.app';
  }

  async onModuleInit() {
    try {
      const config = await this.siteConfigModel.findOne().lean().exec();
      if (config?.siteName) {
        this.siteName = config.siteName;
      }
    } catch (err) {
      this.logger.warn('Could not load site name from DB, using fallback');
    }
  }

  render(vars: TemplateVars, cta?: { url: string; text: string }): string {
    let html = DEFAULT_LAYOUT;

    if (cta) {
      html = html
        .replace('{{#cta}}', '')
        .replace('{{/cta}}', '')
        .replace('{{cta_url}}', cta.url)
        .replace('{{cta_text}}', cta.text);
    } else {
      html = html.replace(/{{#cta}}[\s\S]*?{{\/cta}}/g, '');
    }

    html = html
      .replace(/\{\{site_name\}\}/g, vars.site_name || this.siteName)
      .replace(/\{\{subject\}\}/g, vars.subject)
      .replace(/\{\{content\}\}/g, vars.content)
      .replace(/\{\{unsubscribe_url\}\}/g, vars.unsubscribe_url);

    return html;
  }

  renderContent(content: string, vars: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  buildUnsubscribeUrl(email: string): string {
    return `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}