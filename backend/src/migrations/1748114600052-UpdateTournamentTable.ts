import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTournamentTable1748114600052 implements MigrationInterface {
    name = 'UpdateTournamentTable1748114600052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_b134e8545b3cffdbfe7beed6b2e\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_56d7cc49511bc8e49c2f5749e41\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` CHANGE \`typeId\` \`typeId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` CHANGE \`statusId\` \`statusId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_b134e8545b3cffdbfe7beed6b2e\` FOREIGN KEY (\`typeId\`) REFERENCES \`tournament_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_56d7cc49511bc8e49c2f5749e41\` FOREIGN KEY (\`statusId\`) REFERENCES \`tournament_status\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_56d7cc49511bc8e49c2f5749e41\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_b134e8545b3cffdbfe7beed6b2e\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` CHANGE \`statusId\` \`statusId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` CHANGE \`typeId\` \`typeId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_56d7cc49511bc8e49c2f5749e41\` FOREIGN KEY (\`statusId\`) REFERENCES \`tournament_status\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_b134e8545b3cffdbfe7beed6b2e\` FOREIGN KEY (\`typeId\`) REFERENCES \`tournament_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
