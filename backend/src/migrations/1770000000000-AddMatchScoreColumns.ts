import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMatchScoreColumns1770000000000 implements MigrationInterface {
    name = 'AddMatchScoreColumns1770000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add player1Score and player2Score columns to match table
        // These columns are nullable to allow matches without scores (e.g., scheduled matches)
        await queryRunner.query(`ALTER TABLE \`match\` ADD \`player1Score\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD \`player2Score\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the score columns if migration is rolled back
        await queryRunner.query(`ALTER TABLE \`match\` DROP COLUMN \`player2Score\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP COLUMN \`player1Score\``);
    }
}

