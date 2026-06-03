import {
  Controller,
  Put,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { LandingService } from './landing.service';
import { UpdatePhilosophyDto } from './dto/update-philosophy.dto';
import { CloudinaryService } from '../utils/cloudinary.service';

const AUTHOR_IMAGE_UPLOAD_OPTIONS = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
};

@Controller('admin/landing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminLandingController {
  constructor(
    private landingService: LandingService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * PUT /admin/landing/philosophy
   * Create or update philosophy section
   * Admin only
   */
  @Put('philosophy')
  async updatePhilosophy(@Body() dto: UpdatePhilosophyDto) {
    return this.landingService.updatePhilosophy(dto);
  }

  /**
   * PATCH /admin/landing/author-image
   * Upload author image for the landing page
   */
  @Patch('author-image')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'authorImage', maxCount: 1 }], AUTHOR_IMAGE_UPLOAD_OPTIONS),
  )
  async uploadAuthorImage(@UploadedFiles() files: { authorImage?: any[] }) {
    if (!files.authorImage?.length) {
      throw new BadRequestException('Author image is required');
    }

    const file = files.authorImage[0];

    if (!this.cloudinaryService.isConfigured()) {
      throw new BadRequestException(
        'Cloudinary no está configurado. Actívalo en Ajustes → Almacenamiento.',
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('La imagen debe ser JPEG, PNG o WebP');
    }

    try {
      const imageUrl = await this.cloudinaryService.uploadImage(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      return this.landingService.updateAuthorImageUrl(imageUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al subir la imagen';
      throw new BadRequestException(message);
    }
  }
}
