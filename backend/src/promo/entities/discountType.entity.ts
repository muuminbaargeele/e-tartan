import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class DiscountType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;
}