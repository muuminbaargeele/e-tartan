import { ConfigService } from "../config/services/config.service";

/**
 * Seed system configurations with default values
 * This uses ConfigService to ensure consistency with the config module
 */
export async function seedSysConfig() {
  const configService = new ConfigService();
  
  console.log("Initializing default system configurations...");
  await configService.initializeDefaults();
  console.log("System configurations initialized successfully.");
}
