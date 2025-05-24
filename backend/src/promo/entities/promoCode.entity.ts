import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { DiscountType } from "./discountType.entity";
import { Tournament } from "../../tournament/entities/tournament.entity";

@Entity()
export class PromoCode {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @ManyToOne(() => DiscountType)
    @JoinColumn({ name: "discountTypeId" })
    discountType: DiscountType;

    @Column()
    discountTypeId: number;

    @ManyToOne(() => Tournament, { nullable: true })
    @JoinColumn({ name: "tournamentId" })
    tournament?: Tournament;

    @Column({ nullable: true })
    tournamentId?: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    value: number;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: "timestamp", nullable: true })
    validFrom?: Date;

    @Column({ type: "timestamp", nullable: true })
    validTo?: Date;

    @Column({ type: "int", nullable: true })
    usageLimit?: number;

    @Column({ type: "int", default: 0 })
    usedCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}