import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { RedisService } from 'src/redis/redis.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './users.entity';
import { Response } from 'express';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}
  async createUser(data: CreateUserDto): Promise<User> {
    const existingUser = await this.findUserByEmail(data.email);
    if (existingUser) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'Email already exists',
      });
    }
    const { password } = data;
    if (!password) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Password is required',
      });
    }
    if (password.length < 6) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Password must be at least 6 characters',
      });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({
        ...data,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);
      return savedUser;
    } catch (error) {
      console.log('Error creating user:', error);
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  // Login
  async validateUser(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string } | string | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email and password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email and password',
      });
    }
    try {
      // Generate JWT
      const payload = { userId: user.id, email: user.email };
      const token = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });
      await this.redisService.setToken(user.id, refreshToken, 86400);
      await this.userRepository.update(user.id, { refreshToken: refreshToken });

      return {
        access_token: token,
        refresh_token: refreshToken,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  // Get user
  async getProfile(userId: number, email: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }
    try {
      const { password, refreshToken, ...result } = user;
      return result as User;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  // Get all users
  async getAllUsers(data: {
    user: { userId: number; email: string };
  }): Promise<User[]> {
    const user = await this.findUserByEmail(data.user.email);
    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }
    if (user.role !== 'admin') {
      throw new RpcException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Unauthorized',
      });
    }

    return this.userRepository.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'avatar',
        'phone',
        'address',
        'role',
        'postalCode',
        'city',
        'country',
        'isActive',
      ],
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }
    return this.userRepository.findOne({
      where: { email },
    });
  }

  // Update user
  async updateUser(data: {
    data: CreateUserDto;
    user: { userId: number; email: string };
  }): Promise<User> {
    if (data.data.email && data.user.email !== data.data.email) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Email cannot be updated',
      });
    }
    const user = await this.findUserByEmail(data.user.email);
    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    if (data.data.role && user.role !== 'admin') {
      throw new RpcException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Role cannot be updated',
      });
    }

    if (data.data.password && data.data.password.length < 6) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Password must be at least 6 characters',
      });
    }

    try {
      const { password } = data.data;
      if (password) {
        data.data.password = await bcrypt.hash(password, 10);
      }
      const updatedUser = await this.userRepository.save({
        ...user,
        ...data.data,
      });

      const { password: _, ...result } = updatedUser;
      return result as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  // Delete user
  async deleteUser(data: {
    user: { userId: number; email: string };
  }): Promise<User> {
    const user = await this.findUserByEmail(data.user.email);
    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }
    try {
      await this.userRepository.delete(data.user.userId);
      return user;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  // Refresh token
  async verifyToken(data: string) {
    try {
      const verify = this.jwtService.verify(data);
      return verify;
    } catch (error) {
      return false;
    }
  }
  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.decode(refreshToken) as {
        userId: number;
        email: string;
      };

      if (!decoded || !decoded.userId) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid refresh token',
        });
      }

      let savedToken = await this.redisService.getToken(decoded.userId);

      if (!savedToken) {
        const user = await this.userRepository.findOne({
          where: { id: decoded.userId },
        });

        if (!user || user.refreshToken !== refreshToken) {
          throw new RpcException({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: 'Refresh token is invalid or expired',
          });
        }

        savedToken = user.refreshToken; // Lấy token từ DB
      }
      const verify = await this.verifyToken(savedToken);
      if (!verify) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Refresh token is expired',
        });
      }

      const newAccessToken = this.jwtService.sign(
        { userId: decoded.userId, email: decoded.email },
        { expiresIn: '1m' },
      );

      return { access_token: newAccessToken };
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Could not refresh token',
      });
    }
  }
}
