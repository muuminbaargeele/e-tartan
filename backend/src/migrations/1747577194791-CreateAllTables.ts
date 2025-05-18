import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTables1747577194791 implements MigrationInterface {
    name = 'CreateAllTables1747577194791'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sys_config\` (\`id\` int NOT NULL AUTO_INCREMENT, \`key\` varchar(255) NOT NULL, \`value\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_2c363c25cf99bcaab3a7f389ba\` (\`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`player\` (\`id\` int NOT NULL AUTO_INCREMENT, \`efootballId\` varchar(255) NOT NULL, \`efootballUsername\` varchar(255) NOT NULL, \`avatarUrl\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, UNIQUE INDEX \`IDX_1b2c05c1753d7bc6368be53d41\` (\`efootballId\`), UNIQUE INDEX \`REL_7687919bf054bf262c669d3ae2\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, UNIQUE INDEX \`IDX_ae4578dcaed5adff96595e6166\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`firstName\` varchar(255) NOT NULL, \`middleName\` varchar(255) NULL, \`lastName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`username\` varchar(255) NOT NULL, \`phoneNumber\` varchar(255) NOT NULL, \`passwordHash\` varchar(255) NULL, \`tokenVersion\` int NOT NULL DEFAULT '0', \`isActive\` tinyint NOT NULL DEFAULT 1, \`hasCompleteProfile\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`roleId\` int NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), UNIQUE INDEX \`IDX_f2578043e491921209f5dadd08\` (\`phoneNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`otp\` (\`id\` int NOT NULL AUTO_INCREMENT, \`destination\` varchar(255) NOT NULL, \`code\` varchar(255) NOT NULL, \`type\` enum ('sms', 'email') NOT NULL DEFAULT 'sms', \`purpose\` enum ('register', 'login', 'reset_password', 'other') NOT NULL DEFAULT 'other', \`isUsed\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiresAt\` timestamp NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mobile_operator\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`prefixes\` text NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a1c077333292d98530d64d86af\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`player\` ADD CONSTRAINT \`FK_7687919bf054bf262c669d3ae21\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_c28e52f758e7bbc53828db92194\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`otp\` ADD CONSTRAINT \`FK_db724db1bc3d94ad5ba38518433\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`otp\` DROP FOREIGN KEY \`FK_db724db1bc3d94ad5ba38518433\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_c28e52f758e7bbc53828db92194\``);
        await queryRunner.query(`ALTER TABLE \`player\` DROP FOREIGN KEY \`FK_7687919bf054bf262c669d3ae21\``);
        await queryRunner.query(`DROP INDEX \`IDX_a1c077333292d98530d64d86af\` ON \`mobile_operator\``);
        await queryRunner.query(`DROP TABLE \`mobile_operator\``);
        await queryRunner.query(`DROP TABLE \`otp\``);
        await queryRunner.query(`DROP INDEX \`IDX_f2578043e491921209f5dadd08\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_ae4578dcaed5adff96595e6166\` ON \`role\``);
        await queryRunner.query(`DROP TABLE \`role\``);
        await queryRunner.query(`DROP INDEX \`REL_7687919bf054bf262c669d3ae2\` ON \`player\``);
        await queryRunner.query(`DROP INDEX \`IDX_1b2c05c1753d7bc6368be53d41\` ON \`player\``);
        await queryRunner.query(`DROP TABLE \`player\``);
        await queryRunner.query(`DROP INDEX \`IDX_2c363c25cf99bcaab3a7f389ba\` ON \`sys_config\``);
        await queryRunner.query(`DROP TABLE \`sys_config\``);
    }

}
