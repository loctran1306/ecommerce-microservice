import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Public } from './guard/public.decrator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() body: any) {
    return this.userService.send({ cmd: 'register' }, body);
  }
  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.userService.send({ cmd: 'login' }, body);
  }
}
