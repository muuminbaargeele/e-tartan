import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedPlayerTable1748195274812 implements MigrationInterface {
    name = 'UpdatedPlayerTable1748195274812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_98f0594eed79ba24bd87d8e613\` ON \`player\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_98f0594eed79ba24bd87d8e613\` ON \`player\` (\`efootballTeamName\`)`);
    }

}
