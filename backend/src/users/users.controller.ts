import { Controller, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Request() req: any) {
    await this.usersService.deleteAccount(req.user.userId);
    return { message: 'Account deleted successfully' };
  }
}
