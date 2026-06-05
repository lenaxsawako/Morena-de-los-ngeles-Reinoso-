import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Model, Types, Connection } from 'mongoose';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { RedisStoreService } from '../src/services/redis-store.service';

describe('PurchaseAccessGuard (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let redisStore: RedisStoreService;
  let bookModel: Model<any>;
  let purchaseModel: Model<any>;
  let userModel: Model<any>;
  let connection: Connection;

  const buyerId = new Types.ObjectId().toString();
  const strangerId = new Types.ObjectId().toString();
  const bookId = new Types.ObjectId().toString();
  const bookWithPreviewId = new Types.ObjectId().toString();
  let buyerToken: string;
  let strangerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = app.get(JwtService);
    redisStore = app.get(RedisStoreService);
    connection = app.get(getConnectionToken());
    bookModel = app.get(getModelToken('Book'));
    purchaseModel = app.get(getModelToken('Purchase'));
    userModel = app.get(getModelToken('User'));

    await app.init();

    // Sign tokens
    buyerToken = jwtService.sign({ sub: buyerId, email: 'buyer@test.com' });
    strangerToken = jwtService.sign({ sub: strangerId, email: 'stranger@test.com' });

    // Create test user docs (needed for purchase userRef relation)
    await userModel.insertMany([
      { _id: new Types.ObjectId(buyerId), email: 'buyer@test.com', passwordHash: 'x', roles: ['user'] },
      { _id: new Types.ObjectId(strangerId), email: 'stranger@test.com', passwordHash: 'x', roles: ['user'] },
    ]);

    // Create test books
    await bookModel.insertMany([
      {
        _id: new Types.ObjectId(bookId),
        title: 'Paid Book',
        slug: 'paid-book',
        description: 'test',
        previewPages: 0,
        isPublished: true,
        pageCount: 50,
        priceCents: 1000,
        currency: 'USD',
      },
      {
        _id: new Types.ObjectId(bookWithPreviewId),
        title: 'Free Preview Book',
        slug: 'free-preview-book',
        description: 'test',
        previewPages: 5,
        isPublished: true,
        pageCount: 50,
        priceCents: 1000,
        currency: 'USD',
      },
    ]);

    // Create a PAID purchase for buyer
    await purchaseModel.insertMany([
      {
        userRef: new Types.ObjectId(buyerId),
        bookRef: new Types.ObjectId(bookId),
        purchaseToken: `token-paid-${buyerId}`,
        status: 'paid',
        amountCents: 1000,
        currency: 'USD',
        provider: 'polar',
      },
      // PENDING purchase for buyer on same book — to test that PAID takes precedence
      {
        userRef: new Types.ObjectId(buyerId),
        bookRef: new Types.ObjectId(bookId),
        purchaseToken: `token-pending-${buyerId}`,
        status: 'pending',
        amountCents: 1000,
        currency: 'USD',
        provider: 'polar',
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup test data
    await userModel.deleteMany({ _id: { $in: [new Types.ObjectId(buyerId), new Types.ObjectId(strangerId)] } });
    await bookModel.deleteMany({ _id: { $in: [new Types.ObjectId(bookId), new Types.ObjectId(bookWithPreviewId)] } });
    await purchaseModel.deleteMany({ userRef: new Types.ObjectId(buyerId) });
    await redisStore.flushAll();
    await app.close();
  });

  // =============================================
  // Scenario 1: User with PAID purchase → access granted
  // =============================================
  describe('Scenario 1 — User with PAID purchase', () => {
    it('should allow access to /books/id/:id/page-range (PAID purchase)', async () => {
      // The page-range endpoint needs start/end, but we just check the guard passes (not the actual PDF logic)
      // The guard runs before the handler, so a 200 vs 403 tells us if access was granted
      const res = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${buyerToken}`);

      // Guard passes → handler runs → might fail on PDF logic (no real PDF), but NOT 403
      expect(res.status).not.toBe(403);
    });

    it('should return 403 for a user WITHOUT any purchase (stranger)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Adquirí el libro para continuar');
    });
  });

  // =============================================
  // Scenario 2: Cross-device (same user, different token)
  // =============================================
  describe('Scenario 2 — Same user, different token (cross-device)', () => {
    it('should allow access with a second token for the same userId', async () => {
      const secondToken = jwtService.sign({ sub: buyerId, email: 'buyer@test.com' });
      const res = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${secondToken}`);

      expect(res.status).not.toBe(403);
    });
  });

  // =============================================
  // Scenario 3: Unauthenticated user (no JWT)
  // =============================================
  describe('Scenario 3 — No authentication', () => {
    it('should return 403 for a book without preview pages (no auth)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Adquirí el libro para continuar');
    });

    it('should ALLOW access for a book WITH preview pages (no auth)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/books/id/${bookWithPreviewId}/page-range?start=1&end=1`);

      expect(res.status).not.toBe(403);
    });
  });

  // =============================================
  // Scenario 4: PENDING-only purchase → forbidden
  // =============================================
  describe('Scenario 4 — PENDING purchase (not PAID)', () => {
    let pendingUserId: string;
    let pendingToken: string;

    beforeAll(async () => {
      pendingUserId = new Types.ObjectId().toString();
      pendingToken = jwtService.sign({ sub: pendingUserId, email: 'pending@test.com' });

      await userModel.insertMany([
        { _id: new Types.ObjectId(pendingUserId), email: 'pending@test.com', passwordHash: 'x', roles: ['user'] },
      ]);

      // ONLY a PENDING purchase (no PAID)
      await purchaseModel.insertMany([
        {
          userRef: new Types.ObjectId(pendingUserId),
          bookRef: new Types.ObjectId(bookId),
          purchaseToken: `token-pending-only-${pendingUserId}`,
          status: 'pending',
          amountCents: 1000,
          currency: 'USD',
          provider: 'polar',
        },
      ]);
    });

    afterAll(async () => {
      await userModel.deleteMany({ _id: new Types.ObjectId(pendingUserId) });
      await purchaseModel.deleteMany({ userRef: new Types.ObjectId(pendingUserId) });
    });

    it('should return 403 when user only has a PENDING purchase', async () => {
      const res = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${pendingToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Adquirí el libro para continuar');
    });
  });

  // =============================================
  // Scenario 5: Redis cache behavior
  // =============================================
  describe('Scenario 5 — Redis cache', () => {
    const cacheKey = `access:${buyerId}:${bookId}`;
    const deniedCacheKey = `access:${strangerId}:${bookId}`;

    it('should have created a cache entry after the first successful access', async () => {
      const cached = await redisStore.get(cacheKey);
      expect(cached).toBe('granted');
    });

    it('should use the cached value without querying MongoDB', async () => {
      // Delete the purchase to prove the cache is used
      await purchaseModel.deleteMany({ userRef: new Types.ObjectId(buyerId), bookRef: new Types.ObjectId(bookId), status: 'paid' });

      // Access should still be granted (from cache)
      const res = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).not.toBe(403);

      // Restore purchase for other tests
      await purchaseModel.insertMany([
        {
          userRef: new Types.ObjectId(buyerId),
          bookRef: new Types.ObjectId(bookId),
          purchaseToken: `token-paid-restored-${buyerId}`,
          status: 'paid',
          amountCents: 1000,
          currency: 'USD',
          provider: 'polar',
        },
      ]);
    });

    it('should have cached "denied" for the stranger', async () => {
      const cached = await redisStore.get(deniedCacheKey);
      expect(cached).toBe('denied');
    });

    it('should re-query MongoDB after cache is invalidated', async () => {
      // Invalidate cache manually
      await redisStore.del(cacheKey);

      // Create a PAID purchase again (already restored from before)
      // This should be found and re-cached
      const res = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).not.toBe(403);

      // Verify cache was re-created
      const reCached = await redisStore.get(cacheKey);
      expect(reCached).toBe('granted');
    });

    it('should deny again after invalidation if purchase no longer exists', async () => {
      // Temporarily delete purchase for this test
      const localUserId = new Types.ObjectId().toString();
      const localToken = jwtService.sign({ sub: localUserId, email: 'local@test.com' });
      const localCacheKey = `access:${localUserId}:${bookId}`;

      await userModel.insertMany([
        { _id: new Types.ObjectId(localUserId), email: 'local@test.com', passwordHash: 'x', roles: ['user'] },
      ]);

      // First call: no purchase → denied + cached
      const res1 = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${localToken}`);
      expect(res1.status).toBe(403);

      // Verify "denied" is cached
      expect(await redisStore.get(localCacheKey)).toBe('denied');

      // Now create a purchase
      await purchaseModel.insertMany([
        {
          userRef: new Types.ObjectId(localUserId),
          bookRef: new Types.ObjectId(bookId),
          purchaseToken: `token-local-${localUserId}`,
          status: 'paid',
          amountCents: 1000,
          currency: 'USD',
          provider: 'polar',
        },
      ]);

      // Cache still says "denied" → should return 403 even though purchase now exists
      const res2 = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${localToken}`);
      expect(res2.status).toBe(403);

      // Invalidate cache
      await redisStore.del(localCacheKey);

      // Now the guard re-queries MongoDB and finds the PAID purchase
      const res3 = await request(app.getHttpServer())
        .get(`/books/id/${bookId}/page-range?start=1&end=1`)
        .set('Authorization', `Bearer ${localToken}`);
      expect(res3.status).not.toBe(403);

      // Verify "granted" is now cached
      expect(await redisStore.get(localCacheKey)).toBe('granted');

      // Cleanup
      await userModel.deleteMany({ _id: new Types.ObjectId(localUserId) });
      await purchaseModel.deleteMany({ userRef: new Types.ObjectId(localUserId) });
      await redisStore.del(localCacheKey);
    });
  });
});
