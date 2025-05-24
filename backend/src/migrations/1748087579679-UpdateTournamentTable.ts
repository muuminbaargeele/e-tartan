import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTournamentTable1748087579679 implements MigrationInterface {
    name = 'UpdateTournamentTable1748087579679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tournament_type\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, UNIQUE INDEX \`IDX_b9272bb3399c4bf03ae79d0ebc\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament_status\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, UNIQUE INDEX \`IDX_cdab351b8c634f33490cb6424a\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`type\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`typeId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`statusId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_b134e8545b3cffdbfe7beed6b2e\` FOREIGN KEY (\`typeId\`) REFERENCES \`tournament_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_56d7cc49511bc8e49c2f5749e41\` FOREIGN KEY (\`statusId\`) REFERENCES \`tournament_status\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_56d7cc49511bc8e49c2f5749e41\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_b134e8545b3cffdbfe7beed6b2e\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`statusId\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`typeId\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`status\` enum ('upcoming', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming'`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`type\` enum ('knockout', 'league') NOT NULL DEFAULT 'knockout'`);
        await queryRunner.query(`DROP INDEX \`IDX_cdab351b8c634f33490cb6424a\` ON \`tournament_status\``);
        await queryRunner.query(`DROP TABLE \`tournament_status\``);
        await queryRunner.query(`DROP INDEX \`IDX_b9272bb3399c4bf03ae79d0ebc\` ON \`tournament_type\``);
        await queryRunner.query(`DROP TABLE \`tournament_type\``);
    }

}
