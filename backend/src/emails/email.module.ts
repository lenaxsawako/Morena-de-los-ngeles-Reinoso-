import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailAdminController } from './email-admin.controller';
import { EmailSchema, SiteConfig, SiteConfigSchema, EMAIL_MODEL } from '../models';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    ConfigModule,
    SharedModule,
    MongooseModule.forFeature([
      { name: EMAIL_MODEL, schema: EmailSchema },
      { name: SiteConfig.name, schema: SiteConfigSchema },
    ]),
  ],
  controllers: [EmailAdminController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
