import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedMatchTable1748163065210 implements MigrationInterface {
    name = 'AddedMatchTable1748163065210'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`match_status\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, UNIQUE INDEX \`IDX_5472275bcd911c290dc1cd77cc\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`match\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tournamentId\` int NOT NULL, \`round\` int NOT NULL, \`groupNumber\` int NULL, \`player1Id\` int NOT NULL, \`player2Id\` int NULL, \`scheduledAt\` timestamp NOT NULL, \`playedAt\` timestamp NULL, \`statusId\` int NOT NULL, \`screenshotUrl\` varchar(255) NULL, \`chatId\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_b096f0c0ca94610b3e77128500c\` FOREIGN KEY (\`tournamentId\`) REFERENCES \`tournament\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_7ecd38eb2baa65327de8fc6021f\` FOREIGN KEY (\`player1Id\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_d1f05e5fc2a7f92e29c8e3c8e0f\` FOREIGN KEY (\`player2Id\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_627d5ff9a31cba396bd32c27bbd\` FOREIGN KEY (\`statusId\`) REFERENCES \`match_status\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_627d5ff9a31cba396bd32c27bbd\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_d1f05e5fc2a7f92e29c8e3c8e0f\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_7ecd38eb2baa65327de8fc6021f\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_b096f0c0ca94610b3e77128500c\``);
        await queryRunner.query(`DROP TABLE \`match\``);
        await queryRunner.query(`DROP INDEX \`IDX_5472275bcd911c290dc1cd77cc\` ON \`match_status\``);
        await queryRunner.query(`DROP TABLE \`match_status\``);
    }

}
