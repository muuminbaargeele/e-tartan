import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class MatchStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // scheduled, played, forfeit, draw, missed, bye

  @Column({ nullable: true })
  description?: string;
}