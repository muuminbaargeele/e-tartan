import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedUserAndPlayerTable1747740963995 implements MigrationInterface {
    name = 'UpdatedUserAndPlayerTable1747740963995'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`efootballTeamName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`player\` ADD UNIQUE INDEX \`IDX_98f0594eed79ba24bd87d8e613\` (\`efootballTeamName\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`isDeleted\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`player\` ADD UNIQUE INDEX \`IDX_6212992f62606e887665640864\` (\`efootballUsername\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` DROP INDEX \`IDX_6212992f62606e887665640864\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`isDeleted\``);
        await queryRunner.query(`ALTER TABLE \`player\` DROP INDEX \`IDX_98f0594eed79ba24bd87d8e613\``);
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`efootballTeamName\``);
    }

}
