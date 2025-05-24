import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedParticipantTable1748121013252 implements MigrationInterface {
    name = 'UpdatedParticipantTable1748121013252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` ADD \`promoCodeId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` ADD \`originalPrice\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` ADD \`discountApplied\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` ADD \`finalPrice\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` ADD CONSTRAINT \`FK_63c36ca99f1a5540127313e07e9\` FOREIGN KEY (\`promoCodeId\`) REFERENCES \`promo_code\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` DROP FOREIGN KEY \`FK_63c36ca99f1a5540127313e07e9\``);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` DROP COLUMN \`finalPrice\``);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` DROP COLUMN \`discountApplied\``);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` DROP COLUMN \`originalPrice\``);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` DROP COLUMN \`promoCodeId\``);
    }

}
