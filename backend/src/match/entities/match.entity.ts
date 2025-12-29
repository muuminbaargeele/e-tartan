import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn
} from "typeorm";
import { Tournament } from "../../tournament/entities/tournament.entity";
import { Player } from "../../player/entities/player.entity";
import { MatchStatus } from "./matchStatus.entity";
// import { Result } from "./result.entity";

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: "tournamentId" })
  tournament: Tournament;

  @Column()
  tournamentId: number;

  @Column()
  round: number;

  @Column({ nullable: true })
  groupNumber?: number;

  @ManyToOne(() => Player)
  @JoinColumn({ name: "player1Id" })
  player1: Player;

  @Column()
  player1Id: number;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: "player2Id" })
  player2?: Player;

  @Column({ nullable: true })
  player2Id?: number;

  @Column({ type: "timestamp" })
  scheduledAt: Date;

  @Column({ type: "timestamp", nullable: true })
  playedAt?: Date;

  @ManyToOne(() => MatchStatus)
  @JoinColumn({ name: "statusId" })
  status: MatchStatus;

  @Column()
  statusId: number;

//   @ManyToOne(() => Result, { nullable: true })
//   @JoinColumn({ name: "resultId" })
//   result?: Result;

//   @Column({ nullable: true })
//   resultId?: number;

  @Column({ nullable: true })
  screenshotUrl?: string;

  // If you add chat system later
  @Column({ nullable: true })
  chatId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}