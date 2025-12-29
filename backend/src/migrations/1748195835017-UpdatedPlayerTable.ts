import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedPlayerTable1748195835017 implements MigrationInterface {
    name = 'UpdatedPlayerTable1748195835017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` DROP FOREIGN KEY \`FK_7687919bf054bf262c669d3ae21\``);
        await queryRunner.query(`ALTER TABLE \`player\` CHANGE \`userId\` \`userId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`player\` ADD CONSTRAINT \`FK_7687919bf054bf262c669d3ae21\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` DROP FOREIGN KEY \`FK_7687919bf054bf262c669d3ae21\``);
        await queryRunner.query(`ALTER TABLE \`player\` CHANGE \`userId\` \`userId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`player\` ADD CONSTRAINT \`FK_7687919bf054bf262c669d3ae21\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
