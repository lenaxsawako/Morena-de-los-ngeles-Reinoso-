import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NewsletterService } from './newsletter.service';
import { TransactionalService } from './transactional.service';

@Injectable()
export class NewsletterListener {
  constructor(
    private newsletterService: NewsletterService,
    private transactionalService: TransactionalService,
  ) {}

  @OnEvent('book.published')
  async handleBookPublished(payload: { bookId: string; title: string; coverUrl?: string }) {
    const content = `
      <p>¡Tenemos un nuevo lanzamiento para vos!</p>
      <p><strong>${payload.title}</strong> ya está disponible.</p>
      ${payload.coverUrl ? `<p><img src="${payload.coverUrl}" alt="${payload.title}" style="max-width:200px;border-radius:8px;" /></p>` : ''}
      <p>No te pierdas esta nueva obra. Leela ahora y sumergite en una historia única.</p>
    `;
    await this.newsletterService.sendAutomatedNewsletter(
      `Nuevo lanzamiento: ${payload.title}`,
      content,
      { url: `${this.newsletterService['templateService'].getBaseUrl()}/book/book/${payload.bookId}`, text: 'LEER AHORA' },
    );
  }

  @OnEvent('book.preorder')
  async handlePreorderAvailable(payload: { bookId: string; title: string; coverUrl?: string }) {
    const content = `
      <p>La preventa de <strong>${payload.title}</strong> ya está abierta.</p>
      ${payload.coverUrl ? `<p><img src="${payload.coverUrl}" alt="${payload.title}" style="max-width:200px;border-radius:8px;" /></p>` : ''}
      <p>Asegurá tu ejemplar antes del lanzamiento oficial.</p>
    `;
    await this.newsletterService.sendAutomatedNewsletter(
      `Preventa abierta: ${payload.title}`,
      content,
      { url: `${this.newsletterService['templateService'].getBaseUrl()}/book/book/${payload.bookId}`, text: 'PRE-COMPRAR AHORA' },
    );
  }

  @OnEvent('purchase.completed')
  async handlePurchaseCompleted(payload: { email: string; bookTitle: string; bookId: string; coverUrl?: string; orderNumber?: string; amount?: string }) {
    try {
      await this.transactionalService.sendPurchaseConfirmation(
        payload.email,
        payload.bookTitle,
        payload.bookId,
        payload.orderNumber || payload.bookId,
        payload.amount || '',
        payload.coverUrl,
      );
    } catch (err: any) {
      // Fallback: send via newsletter service as before
      const content = `
        <p>¡Gracias por tu compra! <strong>${payload.bookTitle}</strong> ya es tuyo.</p>
        ${payload.coverUrl ? `<p><img src="${payload.coverUrl}" alt="${payload.bookTitle}" style="max-width:200px;border-radius:8px;" /></p>` : ''}
        <p>Ya podés empezar a leerlo desde cualquier dispositivo.</p>
      `;
      await this.newsletterService.sendAutomatedNewsletter(
        `Gracias por tu compra: ${payload.bookTitle}`,
        content,
        { url: `${this.newsletterService['templateService'].getBaseUrl()}/chapter/${payload.bookId}`, text: 'COMENZAR A LEER' },
      );
    }
  }
}
