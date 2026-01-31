import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWinnerIdToMatchAndTournament1770000000001 implements MigrationInterface {
    name = 'AddWinnerIdToMatchAndTournament1770000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add winnerId column to match table
        await queryRunner.query(`ALTER TABLE \`match\` ADD \`winnerId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_match_winner\` FOREIGN KEY (\`winnerId\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Add winnerId column to tournament table
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`winnerId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_tournament_winner\` FOREIGN KEY (\`winnerId\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign keys and columns
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_tournament_winner\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`winnerId\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_match_winner\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP COLUMN \`winnerId\``);
    }
}

