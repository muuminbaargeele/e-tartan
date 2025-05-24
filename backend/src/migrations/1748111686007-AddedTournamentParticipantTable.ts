import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTournamentParticipantTable1748111686007 implements MigrationInterface {
    name = 'AddedTournamentParticipantTable1748111686007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`subscription_type\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, UNIQUE INDEX \`IDX_70b7eac61352465791efc82f50\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament_participant\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tournamentId\` int NOT NULL, \`playerId\` int NOT NULL, \`joinedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`paid\` tinyint NOT NULL DEFAULT 0, \`subscriptionTypeId\` int NULL, \`isEliminated\` tinyint NOT NULL DEFAULT 0, \`groupNumber\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` ADD CONSTRAINT \`FK_ff34ec6606707ba26db17e16cee\` FOREIGN KEY (\`tournamentId\`) REFERENCES \`tournament\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` ADD CONSTRAINT \`FK_dc4bf5986dc2754e8fa6141de1e\` FOREIGN KEY (\`playerId\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` ADD CONSTRAINT \`FK_4092d580d2dd8eb89882fde87fd\` FOREIGN KEY (\`subscriptionTypeId\`) REFERENCES \`subscription_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` DROP FOREIGN KEY \`FK_4092d580d2dd8eb89882fde87fd\``);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` DROP FOREIGN KEY \`FK_dc4bf5986dc2754e8fa6141de1e\``);
        await queryRunner.query(`ALTER TABLE \`tournament_participant\` DROP FOREIGN KEY \`FK_ff34ec6606707ba26db17e16cee\``);
        await queryRunner.query(`DROP TABLE \`tournament_participant\``);
        await queryRunner.query(`DROP INDEX \`IDX_70b7eac61352465791efc82f50\` ON \`subscription_type\``);
        await queryRunner.query(`DROP TABLE \`subscription_type\``);
    }

}
