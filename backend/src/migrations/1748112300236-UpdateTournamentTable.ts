import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTournamentTable1748112300236 implements MigrationInterface {
    name = 'UpdateTournamentTable1748112300236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`subscriptionTypeId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_ae3f9b53dd92206dae4f59d51ac\` FOREIGN KEY (\`subscriptionTypeId\`) REFERENCES \`subscription_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_ae3f9b53dd92206dae4f59d51ac\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`subscriptionTypeId\``);
    }

}
