import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../models/book.schema';
import { SiteConfig, SiteConfigSchema } from '../models/site-config.schema';
import { LandingService } from './landing.service';
import { LandingController } from './landing.controller';
import { AdminLandingController } from './admin-landing.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Book.name,
        schema: BookSchema,
      },
      {
        name: SiteConfig.name,
        schema: SiteConfigSchema,
      },
    ]),
    SharedModule,
  ],
  providers: [LandingService],
  controllers: [LandingController, AdminLandingController],
  exports: [LandingService],
})
export class LandingModule {}
