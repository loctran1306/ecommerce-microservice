import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/auth/register' || req.path === '/auth/login') {
      return next(); // Không check token khi đăng ký & đăng nhập
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const user = await this.authService.validateUser(token);
    if (!user) {
      throw new UnauthorizedException('Token hết hạn hoặc không hợp lệ');
    }

    req['user'] = user;
    next();
  }
}
