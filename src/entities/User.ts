import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    username!: string; // New: username generated from phoneNumber

    @Column({ unique: true })
    phoneNumber!: string;

    @Column({ nullable: true })
    passwordHash?: string;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @BeforeInsert()
    setUsername() {
        // Use only numbers from phoneNumber, or add "user" prefix if you wish
        this.username = "user" + this.phoneNumber.replace(/\D/g, "");
    }
}