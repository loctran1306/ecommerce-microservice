import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    try {
      const { password } = data;

      if (!password) {
        throw new BadRequestException('Password is required');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({
        ...data,
        password: hashedPassword,
      });
      const savedUser = await this.userRepository.save(user);

      return savedUser;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ access_token: string } | string | null> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        return 'email and password not match';
      } else {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return 'Invalid email and password';
        }
        // Generate JWT
        const payload = { userId: user.id, email: user.email };
        return {
          access_token: this.jwtService.sign(payload),
        };
      }
    } catch (error) {
      console.error('Error validating user:', error);
      return 'email and password not match';
    }
  }

  async getProfile(userId: number, email: string): Promise<User | null> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }
}
