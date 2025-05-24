import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedPromoTable1748120124090 implements MigrationInterface {
    name = 'AddedPromoTable1748120124090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`discount_type\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, UNIQUE INDEX \`IDX_f20199f79661cdc9267866b77a\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promo_code\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(255) NOT NULL, \`discountTypeId\` int NOT NULL, \`value\` decimal(10,2) NOT NULL, \`description\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`validFrom\` timestamp NULL, \`validTo\` timestamp NULL, \`usageLimit\` int NULL, \`usedCount\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a456233366901b110f09fe478e\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`promo_code\` ADD CONSTRAINT \`FK_17a4f76347c4ce472498cb5bd5a\` FOREIGN KEY (\`discountTypeId\`) REFERENCES \`discount_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`promo_code\` DROP FOREIGN KEY \`FK_17a4f76347c4ce472498cb5bd5a\``);
        await queryRunner.query(`DROP INDEX \`IDX_a456233366901b110f09fe478e\` ON \`promo_code\``);
        await queryRunner.query(`DROP TABLE \`promo_code\``);
        await queryRunner.query(`DROP INDEX \`IDX_f20199f79661cdc9267866b77a\` ON \`discount_type\``);
        await queryRunner.query(`DROP TABLE \`discount_type\``);
    }

}
