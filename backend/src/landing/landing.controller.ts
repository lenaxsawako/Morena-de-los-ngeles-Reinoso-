import { Controller, Get, Body } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { LandingService } from './landing.service';

@Controller('landing')
export class LandingController {
  constructor(private landingService: LandingService) {}

  /**
   * GET /landing
   * Returns all landing page content: latest release, philosophy, featured books, latest volumes
   * Public endpoint - no authentication required
   */
  @Get()
  @Public()
  async getLandingPage() {
    return this.landingService.getLandingPage();
  }

  /**
   * GET /landing/philosophy
   * Returns the philosophy section
   * Public endpoint
   */
  @Get('philosophy')
  @Public()
  async getPhilosophy() {
    return this.landingService.getPhilosophy();
  }
}
