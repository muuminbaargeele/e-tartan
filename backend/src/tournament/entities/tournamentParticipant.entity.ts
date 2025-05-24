import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from "typeorm";
import { Tournament } from "./tournament.entity";
import { Player } from "../../player/entities/player.entity";
import { SubscriptionType } from "../../subscription/entities/subscriptionType.entity";
import { PromoCode } from "../../promo/entities/promoCode.entity"; // Import PromoCode

@Entity("tournament_participant")
export class TournamentParticipant {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Tournament)
    @JoinColumn({ name: "tournamentId" })
    tournament: Tournament;

    @Column()
    tournamentId: number;

    @ManyToOne(() => Player)
    @JoinColumn({ name: "playerId" })
    player: Player;

    @Column()
    playerId: number;

    @CreateDateColumn()
    joinedAt: Date;

    @Column({ default: false })
    paid: boolean;

    @ManyToOne(() => SubscriptionType, { nullable: true })
    @JoinColumn({ name: "subscriptionTypeId" })
    subscriptionType?: SubscriptionType;

    @Column({ nullable: true })
    subscriptionTypeId?: number;

    @Column({ default: false })
    isEliminated: boolean;

    @Column({ nullable: true })
    groupNumber?: number;

    // New fields for promo and discounts
    @ManyToOne(() => PromoCode, { nullable: true })
    @JoinColumn({ name: "promoCodeId" })
    promoCode?: PromoCode;

    @Column({ nullable: true })
    promoCodeId?: number;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    originalPrice?: number;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    discountApplied?: number;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    finalPrice?: number;
}