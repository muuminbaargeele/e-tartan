import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTournamentTable1747938370565 implements MigrationInterface {
    name = 'UpdateTournamentTable1747938370565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`createdById\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_5fabbab4a4e6de967182550fa6c\` FOREIGN KEY (\`createdById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_5fabbab4a4e6de967182550fa6c\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`createdById\``);
    }

}
