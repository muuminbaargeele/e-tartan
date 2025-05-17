import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./user.entity";

export enum SmsOtpPurpose {
  REGISTER = "register",
  LOGIN = "login",
  RESET_PASSWORD = "reset_password",
  OTHER = "other"
}

@Entity()
export class SmsOtp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phoneNumber: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Column()
  code: string;

  @Column({
    type: "enum",
    enum: SmsOtpPurpose,
    default: SmsOtpPurpose.OTHER
  })
  purpose: SmsOtpPurpose;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date | null;
}