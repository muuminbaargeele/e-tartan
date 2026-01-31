import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSysConfigValueToJson1769890305000 implements MigrationInterface {
    name = 'UpdateSysConfigValueToJson1769890305000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change value column from VARCHAR(255) to JSON type
        // MySQL supports JSON type natively, which allows storing complex objects
        // This is required for the config module to store nested configuration objects
        await queryRunner.query(`ALTER TABLE \`sys_config\` MODIFY COLUMN \`value\` JSON NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to VARCHAR(255)
        // Note: This will lose any JSON data, converting it to string representation
        await queryRunner.query(`ALTER TABLE \`sys_config\` MODIFY COLUMN \`value\` VARCHAR(255) NOT NULL`);
    }
}

