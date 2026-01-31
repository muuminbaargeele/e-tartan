import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsPrivateToTournament1770000000002 implements MigrationInterface {
    name = 'AddIsPrivateToTournament1770000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isPrivate column to tournament table
        // Default to false (public) for existing tournaments
        // Nullable to handle existing records gracefully
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`isPrivate\` tinyint NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the isPrivate column
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`isPrivate\``);
    }
}

