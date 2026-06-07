import { Controller, Get, Header } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Public } from '../decorators/public.decorator';
import { Book, BookDocument } from '../models/book.schema';

@Controller()
export class SeoController {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  @Get('sitemap.xml')
  @Public()
  @Header('Content-Type', 'application/xml')
  async getSitemap(): Promise<string> {
    const siteUrl = process.env.SITE_URL || 'https://morenareinoso.com';
    const publishedBooks = await this.bookModel.find({ isPublished: true }).select('_id').lean();
    const now = new Date().toISOString();

    const staticUrls = [
      { loc: '/', changefreq: 'weekly', priority: '1.0' },
      { loc: '/catalog', changefreq: 'weekly', priority: '0.9' },
      { loc: '/privacy-policy', changefreq: 'monthly', priority: '0.3' },
      { loc: '/tos', changefreq: 'monthly', priority: '0.3' },
      { loc: '/support', changefreq: 'monthly', priority: '0.3' },
    ];

    const urls = staticUrls.map(u => `
    <url>
      <loc>${siteUrl}${u.loc}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>${u.changefreq}</changefreq>
      <priority>${u.priority}</priority>
    </url>`).join('');

    const bookUrls = publishedBooks.map(b => `
    <url>
      <loc>${siteUrl}/book/${b._id}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}${bookUrls}
</urlset>`;
  }

  @Get('robots.txt')
  @Public()
  @Header('Content-Type', 'text/plain')
  getRobotsTxt(): string {
    const siteUrl = process.env.SITE_URL || 'https://morenareinoso.com';
    return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${siteUrl}/sitemap.xml`;
  }
}
