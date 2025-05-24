import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { TournamentStatus } from "./tournamentStatus.entity";
import { TournamentType } from "./tournamentType.entity";

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => TournamentType)
  type: TournamentType;

  @ManyToOne(() => TournamentStatus)
  status: TournamentStatus;

  @Column({ type: "timestamp" })
  startDate: Date;

  @Column({ type: "timestamp" })
  endDate: Date;

  @Column({ type: "int", default: 32 })
  maxPlayers: number;

  @Column({ type: "boolean", default: false })
  isAuto: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;

}