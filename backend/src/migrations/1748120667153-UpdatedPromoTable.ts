import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedPromoTable1748120667153 implements MigrationInterface {
    name = 'UpdatedPromoTable1748120667153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`promo_code\` ADD \`tournamentId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`promo_code\` ADD CONSTRAINT \`FK_12935a85b63500ffda11f179a05\` FOREIGN KEY (\`tournamentId\`) REFERENCES \`tournament\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`promo_code\` DROP FOREIGN KEY \`FK_12935a85b63500ffda11f179a05\``);
        await queryRunner.query(`ALTER TABLE \`promo_code\` DROP COLUMN \`tournamentId\``);
    }

}
