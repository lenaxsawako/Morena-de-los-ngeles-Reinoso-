import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './emails/email.module';
import { ReaderModule } from './reader/reader.module';
import { LandingModule } from './landing/landing.module';
import { CatalogModule } from './catalog/catalog.module';
import { AdminModule } from './admin/admin.module';
import { SharedModule } from './shared/shared.module';
import { SubscriptionModule } from './subscriptions/subscription.module';
import { CheckoutModule } from './checkout/checkout.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReviewModule } from './reviews/review.module';
import { RedisStoreService } from './services/redis-store.service';
import { IpExtractorService } from './services/ip-extractor.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    SharedModule,
    AuthModule,
    UsersModule,
    EmailModule,
    ReaderModule,
    LandingModule,
    CatalogModule,
    AdminModule,
    SubscriptionModule,
    CheckoutModule,
    FavoritesModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisStoreService, IpExtractorService],
})
export class AppModule {}
