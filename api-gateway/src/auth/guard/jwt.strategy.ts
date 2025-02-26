import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy JWT từ headers
      ignoreExpiration: false, // Hết hạn sẽ bị từ chối
      secretOrKey: process.env.JWT_SECRET || 'secret', // Secret key để verify token
    });
  }

  async validate(payload: any) {
    console.log('payload', payload);

    return { userId: payload.userId, email: payload.email }; // Trả về user từ payload JWT
  }
}
