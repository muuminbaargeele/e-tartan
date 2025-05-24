import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedUserTable1747732707471 implements MigrationInterface {
    name = 'UpdatedUserTable1747732707471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`verifiedViaSms\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`verifiedViaEmail\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`forceVerifyViaEmail\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`forceVerifyViaEmail\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`verifiedViaEmail\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`verifiedViaSms\``);
    }

}
