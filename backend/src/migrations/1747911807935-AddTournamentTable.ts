import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentTable1747911807935 implements MigrationInterface {
    name = 'AddTournamentTable1747911807935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tournament\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`type\` enum ('knockout', 'league') NOT NULL DEFAULT 'knockout', \`status\` enum ('upcoming', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming', \`startDate\` timestamp NOT NULL, \`endDate\` timestamp NOT NULL, \`maxPlayers\` int NOT NULL DEFAULT '32', \`isAuto\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`tournament\``);
    }

}
