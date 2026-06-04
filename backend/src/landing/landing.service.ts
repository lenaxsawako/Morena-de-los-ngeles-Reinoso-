import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../models/book.schema';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';
import { UpdatePhilosophyDto } from './dto/update-philosophy.dto';

@Injectable()
export class LandingService {
  constructor(
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,
    @InjectModel(SiteConfig.name)
    private siteConfigModel: Model<SiteConfigDocument>,
  ) {}

  /**
   * Get the latest release (hero section)
   */
  async getLatestRelease() {
    const book = await this.bookModel
      .findOne({ isLatestRelease: true })
      .select('_id title subtitle slug description coverUrl priceCents currency')
      .lean()
      .exec();

    if (!book) {
      return null;
    }

    return {
      _id: book._id,
      title: book.title,
      subtitle: book.subtitle,
      slug: book.slug,
      description: book.description,
      coverUrl: book.coverUrl,
      priceCents: book.priceCents,
      currency: book.currency,
    };
  }

  /**
   * Get featured books (featured stories section)
   */
  async getFeaturedBooks() {
    const books = await this.bookModel
      .find({ isFeatured: true })
      .select('_id title subtitle description coverUrl')
      .limit(3)
      .lean()
      .exec();

    return books.map((book) => ({
      _id: book._id,
      title: book.title,
      subtitle: book.subtitle,
      description: book.description,
      coverUrl: book.coverUrl,
    }));
  }

  /**
   * Get latest published volumes
   */
  async getLatestVolumes() {
    const books = await this.bookModel
      .find({ isPublished: true })
      .select('_id title subtitle publishedAt coverUrl')
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean()
      .exec();

    return books.map((book) => ({
      _id: book._id,
      title: book.title,
      subtitle: book.subtitle,
      publishedAt: book.publishedAt,
      coverUrl: book.coverUrl,
    }));
  }

  /**
   * Get complete landing page data
   */
  async getLandingPage() {
    const [latestRelease, featuredBooks, latestVolumes, philosophy, siteConfig] = await Promise.all([
      this.getLatestRelease(),
      this.getFeaturedBooks(),
      this.getLatestVolumes(),
      this.getPhilosophy(),
      this.siteConfigModel.findOne().select('siteName socialLinks logoUrl').lean().exec(),
    ]);

    return {
      latestRelease,
      philosophy,
      featuredBooks,
      latestVolumes,
      siteName: siteConfig?.siteName || '',
      logoUrl: siteConfig?.logoUrl || '',
      socialLinks: siteConfig?.socialLinks || { instagram: '', twitter: '', tiktok: '', youtube: '' },
    };
  }

  /**
   * Get philosophy section
   */
  async getPhilosophy() {
    const siteConfig = await this.siteConfigModel.findOne().select('landing').lean().exec();

    if (!siteConfig || !siteConfig.landing?.philosophy) {
      return {
        title: '',
        content: '',
        authorImageUrl: null,
      };
    }

    return {
      title: siteConfig.landing.philosophy.title,
      content: siteConfig.landing.philosophy.content,
      authorImageUrl: siteConfig.landing.authorImageUrl || null,
    };
  }

  /**
   * Update philosophy section
   * Creates SiteConfig if it does not exist
   */
  async updatePhilosophy(dto: UpdatePhilosophyDto) {
    const setFields: Record<string, any> = {
      'landing.philosophy.title': dto.title.trim(),
      'landing.philosophy.content': dto.content.trim(),
    };

    if (dto.authorImageUrl !== undefined) {
      setFields['landing.authorImageUrl'] = dto.authorImageUrl;
    }

    // Update or create
    const siteConfig = await this.siteConfigModel.findOneAndUpdate(
      {},
      { $set: setFields },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return {
      title: siteConfig.landing.philosophy.title,
      content: siteConfig.landing.philosophy.content,
      authorImageUrl: siteConfig.landing.authorImageUrl || null,
    };
  }

  /**
   * Update author image URL
   */
  async updateAuthorImageUrl(imageUrl: string) {
    const siteConfig = await this.siteConfigModel.findOneAndUpdate(
      {},
      { $set: { 'landing.authorImageUrl': imageUrl } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return { authorImageUrl: siteConfig.landing.authorImageUrl };
  }
}