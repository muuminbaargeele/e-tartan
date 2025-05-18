import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOTPTable1747580405745 implements MigrationInterface {
    name = 'UpdateOTPTable1747580405745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`otp\` DROP COLUMN \`purpose\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`otp\` ADD \`purpose\` enum ('register', 'login', 'reset_password', 'other') NOT NULL DEFAULT 'other'`);
    }

}
