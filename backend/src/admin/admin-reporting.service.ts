import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase, PurchaseDocument } from '../models/purchase.schema';
import { Book, BookDocument } from '../models/book.schema';

@Injectable()
export class AdminReportingService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  /**
   * Get comprehensive analytics dashboard
   */
  async getAnalytics(period: string = '30d') {
    this.validatePeriod(period);

    const [summary, chart, topBooks] = await Promise.all([
      this.getSummary(),
      this.getRevenueChart(period),
      this.getTopBooks(),
    ]);

    return {
      summary,
      chart,
      topBooks,
    };
  }

  /**
   * Get summary metrics (all-time)
   */
  async getSummary() {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const [totalData, monthlyData] = await Promise.all([
      this.purchaseModel.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amountCents' },
            totalPurchases: { $sum: 1 },
          },
        },
      ]),
      this.purchaseModel.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: { $gte: currentMonthStart },
          },
        },
        {
          $group: {
            _id: null,
            monthlyRevenue: { $sum: '$amountCents' },
          },
        },
      ]),
    ]);

    const totalRevenue = totalData[0]?.totalRevenue || 0;
    const totalPurchases = totalData[0]?.totalPurchases || 0;
    const monthlyRevenue = monthlyData[0]?.monthlyRevenue || 0;

    return {
      totalRevenue: parseFloat((totalRevenue / 100).toFixed(2)),
      monthlyRevenue: parseFloat((monthlyRevenue / 100).toFixed(2)),
      totalPurchases,
      averageOrderValue:
        totalPurchases > 0 ? parseFloat(((totalRevenue / totalPurchases) / 100).toFixed(2)) : 0,
    };
  }

  /**
   * Get revenue chart for specified period
   */
  async getRevenueChart(period: string) {
    this.validatePeriod(period);

    const startDate = this.getPeriodStartDate(period);
    const groupFormat = this.getGroupFormat(period);

    const data = await this.purchaseModel.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          revenue: { $sum: '$amountCents' },
          purchases: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return data.map((item) => ({
      label: item._id,
      revenue: parseFloat((item.revenue / 100).toFixed(2)),
      purchases: item.purchases,
    }));
  }

  /**
   * Get top 10 performing books
   */
  async getTopBooks() {
    const data = await this.purchaseModel.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$bookRef',
          revenue: { $sum: '$amountCents' },
          purchases: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book',
        },
      },
      {
        $addFields: {
          book: { $arrayElemAt: ['$book', 0] },
        },
      },
    ]);

    return data.map((item) => {
      const views = item.book?.views || 1; // Avoid division by zero
      const conversionRate = parseFloat(((item.purchases / views) * 100).toFixed(1));

      return {
        bookId: item._id,
        title: item.book?.title || 'Unknown',
        coverUrl: item.book?.coverUrl || null,
        revenue: parseFloat((item.revenue / 100).toFixed(2)),
        purchases: item.purchases,
        conversionRate,
      };
    });
  }

  /**
   * Get transaction history with pagination and filtering
   */
  async getTransactions(page: number = 1, limit: number = 20, status?: string) {
    if (status && !['paid', 'pending', 'failed', 'refunded'].includes(status)) {
      throw new BadRequestException('Invalid status. Must be paid, pending, failed, or refunded');
    }

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.purchaseModel
        .find(filter)
        .select('_id userRef bookRef amountCents currency provider status createdAt')
        .populate('userRef', 'email')
        .populate('bookRef', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.purchaseModel.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      items: transactions.map((t: any) => ({
        purchaseId: t._id,
        userEmail: t.userRef?.email || 'Unknown',
        bookTitle: t.bookRef?.title || 'Unknown',
        price: parseFloat((t.amountCents / 100).toFixed(2)),
        currency: t.currency || 'USD',
        provider: t.provider || 'unknown',
        status: t.status,
        createdAt: t.createdAt,
      })),
      total,
      page,
      pages,
    };
  }

  /**
   * Export transactions as CSV
   */
  async exportTransactionsCSV(status?: string): Promise<string> {
    if (status && !['paid', 'pending', 'failed', 'refunded'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const transactions = await this.purchaseModel
      .find(filter)
      .select('_id userRef bookRef amountCents currency provider status createdAt')
      .populate('userRef', 'email')
      .populate('bookRef', 'title')
      .sort({ createdAt: -1 })
      .lean();

    // CSV headers
    const headers = ['Date', 'Purchase ID', 'User Email', 'Book', 'Price', 'Currency', 'Provider', 'Status'];
    const rows = [headers];

    // Add data rows
    transactions.forEach((t: any) => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      const price = (t.amountCents / 100).toFixed(2);

      rows.push([
        date,
        t._id.toString(),
        t.userRef?.email || 'Unknown',
        t.bookRef?.title || 'Unknown',
        price,
        t.currency || 'USD',
        t.provider || 'unknown',
        t.status,
      ]);
    });

    // Convert to CSV format
    return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * Validate period parameter
   */
  private validatePeriod(period: string) {
    const validPeriods = ['7d', '30d', '90d', '12m'];
    if (!validPeriods.includes(period)) {
      throw new BadRequestException(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }
  }

  /**
   * Get start date based on period
   */
  private getPeriodStartDate(period: string): Date {
    const now = new Date();

    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '12m':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get MongoDB date format string for grouping
   */
  private getGroupFormat(period: string): string {
    switch (period) {
      case '7d':
      case '30d':
        return '%Y-%m-%d'; // Daily
      case '90d':
        return '%Y-%U'; // Weekly (week of year)
      case '12m':
        return '%Y-%m'; // Monthly
      default:
        return '%Y-%m-%d';
    }
  }
}
