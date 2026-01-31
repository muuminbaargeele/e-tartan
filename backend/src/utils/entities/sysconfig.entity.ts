import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SysConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column("json")
  value: any;
}