import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, JoinColumn } from "typeorm";
import { Player } from "../../player/entities/player.entity";
import { Role } from "./role.entity";

export enum UserRole {
    ADMIN = "admin",
    PLAYER = "player",
    // add more as needed
}

@Entity()
export class User {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
    firstName!: string;

    @Column({ nullable: true })
    middleName?: string;

    @Column()
    lastName!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ unique: true })
    username!: string;

    @Column({ unique: true })
    phoneNumber!: string;

    @Column({ nullable: true })
    passwordHash?: string;

    @Column({ default: 0 })
    tokenVersion: number;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ default: false })
    hasCompleteProfile!: boolean;

    @ManyToOne(() => Role)
    @JoinColumn({ name: "roleId", })
    role: Role;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Relation to Player (optional, only for players)
    @OneToOne(() => Player, player => player.user)
    player?: Player;
}