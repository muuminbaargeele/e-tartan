import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { OtpType, OtpPurpose } from "../../utils/enums";

@Entity()
export class Otp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  destination: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Column()
  code: string;

  @Column({ type: "enum", enum: OtpType, default: OtpType.SMS })
  type: OtpType;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date | null;
}