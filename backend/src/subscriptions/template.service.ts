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
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#0a0a0a;">
          <tr>
            <td align="center" style="padding:30px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
              <h1 style="color:#F3EAD3;font-size:24px;margin:0;font-weight:400;letter-spacing:2px;">{{site_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 0;color:#e5e2e1;font-size:16px;line-height:1.8;">
              {{content}}
            </td>
          </tr>
          {{#cta}}
          <tr>
            <td align="center" style="padding:20px 0;">
              <a href="{{cta_url}}" style="display:inline-block;padding:14px 36px;background-color:#F3EAD3;color:#0a0a0a;text-decoration:none;font-size:14px;letter-spacing:2px;text-transform:uppercase;">{{cta_text}}</a>
            </td>
          </tr>
          {{/cta}}
          {{#show_unsubscribe}}
          <tr>
            <td align="center" style="padding:30px 0;border-top:1px solid rgba(255,255,255,0.1);font-size:12px;color:rgba(255,255,255,0.4);">
              <p style="margin:0;">Si no deseas recibir más correos, puedes <a href="{{unsubscribe_url}}" style="color:rgba(255,255,255,0.6);">cancelar tu suscripción</a>.</p>
            </td>
          </tr>
          {{/show_unsubscribe}}
        </table>
      </td>
    </tr>
  </table>
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

    const showUnsubscribe = !!vars.unsubscribe_url;

    if (showUnsubscribe) {
      html = html
        .replace('{{#show_unsubscribe}}', '')
        .replace('{{/show_unsubscribe}}', '')
        .replace(/\{\{unsubscribe_url\}\}/g, vars.unsubscribe_url);
    } else {
      html = html.replace(/{{#show_unsubscribe}}[\s\S]*?{{\/show_unsubscribe}}/g, '');
    }

    html = html
      .replace(/\{\{site_name\}\}/g, vars.site_name || this.siteName)
      .replace(/\{\{subject\}\}/g, vars.subject)
      .replace(/\{\{content\}\}/g, vars.content);

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