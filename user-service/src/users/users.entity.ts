import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  phone: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 'Vietnam' })
  country: string;

  @Column({ default: 'VN' })
  postalCode: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ default: true })
  isActive: boolean;
}
