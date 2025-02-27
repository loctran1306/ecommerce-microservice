import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './users.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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
  ): Promise<{ access_token: string } | string | null> {
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
      return {
        access_token: this.jwtService.sign(payload),
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
      const { password, ...result } = user;
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
}
