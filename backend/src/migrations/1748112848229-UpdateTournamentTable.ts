import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTournamentTable1748112848229 implements MigrationInterface {
    name = 'UpdateTournamentTable1748112848229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`price\` decimal(10,2) NOT NULL DEFAULT '0.00'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`price\``);
    }

}
