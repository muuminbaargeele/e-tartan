import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { TournamentStatus } from "./tournamentStatus.entity";
import { TournamentType } from "./tournamentType.entity";
import { SubscriptionType } from "../../subscription/entities/subscriptionType.entity";
import { Player } from "../../player/entities/player.entity";

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => TournamentType)
  @JoinColumn({ name: "typeId" })
  type: TournamentType;

  @Column()
  typeId: number;

  @ManyToOne(() => TournamentStatus)
  @JoinColumn({ name: "statusId" })
  status: TournamentStatus;

  @Column()
  statusId: number;

  @Column({ type: "timestamp" })
  startDate: Date;

  @Column({ type: "timestamp" })
  endDate: Date;

  @Column({ type: "int", default: 32 })
  maxPlayers: number;

  @Column({ type: "boolean", default: false })
  isAuto: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "createdById" })
  createdBy?: User;

  @Column({ nullable: true })
  createdById?: number;

  @ManyToOne(() => SubscriptionType, { nullable: true })
  @JoinColumn({ name: "subscriptionTypeId" })
  subscriptionType?: SubscriptionType;

  @Column({ nullable: true })
  subscriptionTypeId?: number;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: "winnerId" })
  winner?: Player;

  @Column({ nullable: true })
  winnerId?: number;

  @Column({ type: "boolean", default: false, nullable: true })
  isPrivate?: boolean;

}