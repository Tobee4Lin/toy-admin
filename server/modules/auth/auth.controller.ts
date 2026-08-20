import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: { user: { userId: number; username: string } }) {
    return {
      id: req.user.userId,
      username: req.user.username,
    };
  }
}
