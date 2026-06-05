import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { SiteConfig, SiteConfigSchema } from '../models/site-config.schema';
import { RedisStoreService } from '../services/redis-store.service';
import { CloudinaryService } from '../utils/cloudinary.service';
import { DriveService } from '../utils/drive.service';
import { PolarService } from '../utils/polar.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change_this_secret',
      signOptions: { expiresIn: '7d' },
    }),
    MongooseModule.forFeature([
      { name: SiteConfig.name, schema: SiteConfigSchema },
    ]),
  ],
  providers: [JwtAuthGuard, RolesGuard, RedisStoreService, CloudinaryService, DriveService, PolarService],
  exports: [JwtModule, MongooseModule, JwtAuthGuard, RolesGuard, RedisStoreService, CloudinaryService, DriveService, PolarService],
})
export class SharedModule {}
