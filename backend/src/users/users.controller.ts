import { Controller, Delete, Put, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Request() req: any) {
    await this.usersService.deleteAccount(req.user.userId);
    return { message: 'Account deleted successfully' };
  }

  @Put('me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const valid = await this.usersService.validatePassword(req.user.userId, dto.oldPassword);
    if (!valid) throw new BadRequestException('La contraseña actual no es correcta');
    await this.usersService.updatePassword(req.user.userId, dto.newPassword);
    return { message: 'Contraseña actualizada correctamente' };
  }
}
