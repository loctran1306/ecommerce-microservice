import { Controller, Post, Body, Inject, Req, Res } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Public } from './guard/public.decrator';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { Response, Request } from 'express';

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
  async login(
    @Body() body: { email: string; password: string },
    @Res() response: Response,
  ) {
    const res = await this.userService.send({ cmd: 'login' }, body).toPromise();
    if (res && res.data && res.data.refresh_token) {
      response.cookie('refresh_token', res.data.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 86400 * 1000,
      });
    }
    response.status(200).json({
      statusCode: '200',
      message: 'success',
      data: {
        access_token: res.data.access_token,
      },
    });
  }

  @Post('refresh')
  async refresh(@Req() request: Request) {
    let token: string | undefined;
    if (request.headers.authorization) {
      token = request.headers.authorization.replace('Bearer ', '');
    }
    if (!token && request.cookies?.refresh_token) {
      token = request.cookies.refresh_token;
    }
    return this.userService.send({ cmd: 'refresh' }, token);
  }
}
