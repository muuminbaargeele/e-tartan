import AppDataSource from "../../data-source";
import { SysConfig } from "../../utils/entities/sysconfig.entity";

export class ConfigService {
    private configRepo = AppDataSource.getRepository(SysConfig);
    private cache: Record<string, any> = {};

    /**
     * Initialize default configurations if they don't exist
     */
    async initializeDefaults() {
        const defaults = {
            tournament_rules: {
                walkoverScore: 3,
                submissionDeadlineHours: 24,
            },
            match_rules: {
                autoDrawEnabled: true,
                autoDrawTime: "0 0 * * *", // Midnight daily
            },
            bot_config: {
                whatsappEnabled: true,
                welcomeMessage: "Welcome to e-tartan Tournament!",
            },
            ocr_config: {
                confidenceThreshold: 80,
                allowedTimeDifferenceMinutes: 120 // 2 hours
            },
            otp_config: {
                isSmsOtpActive: false,
                isEmailOtpActive: true,
                otpExpirationMinutes: 10,
                maxOtpAttempts: 3
            },
            app_config: {
                maintenanceMode: false,
                maxFileUploadSizeMB: 10,
                allowedFileTypes: ["image/jpeg", "image/png", "image/jpg"]
            }
        };

        for (const [key, value] of Object.entries(defaults)) {
            const exists = await this.configRepo.findOneBy({ key });
            if (!exists) {
                const config = new SysConfig();
                config.key = key;
                config.value = value;
                await this.configRepo.save(config);
            }
        }
    }

    /**
     * Get a configuration value by key
     */
    async get(key: string): Promise<any> {
        if (this.cache[key]) return this.cache[key];

        const config = await this.configRepo.findOneBy({ key });
        if (config) {
            this.cache[key] = config.value;
            return config.value;
        }
        return null;
    }

    /**
     * Get all configurations
     */
    async getAll(): Promise<Record<string, any>> {
        const configs = await this.configRepo.find();
        const result: Record<string, any> = {};
        
        for (const config of configs) {
            result[config.key] = config.value;
            this.cache[config.key] = config.value;
        }
        
        return result;
    }

    /**
     * Get configuration with metadata (key, value, id)
     */
    async getWithMetadata(key: string): Promise<{ id: number; key: string; value: any } | null> {
        const config = await this.configRepo.findOneBy({ key });
        if (config) {
            this.cache[key] = config.value;
            return {
                id: config.id,
                key: config.key,
                value: config.value
            };
        }
        return null;
    }

    /**
     * Get all configurations with metadata
     */
    async getAllWithMetadata(): Promise<Array<{ id: number; key: string; value: any }>> {
        const configs = await this.configRepo.find();
        const result = configs.map(config => {
            this.cache[config.key] = config.value;
            return {
                id: config.id,
                key: config.key,
                value: config.value
            };
        });
        return result;
    }

    /**
     * Update a configuration value
     */
    async set(key: string, value: any): Promise<SysConfig> {
        let config = await this.configRepo.findOneBy({ key });
        if (!config) {
            config = new SysConfig();
            config.key = key;
        }
        config.value = value;
        const saved = await this.configRepo.save(config);
        this.cache[key] = value;
        return saved;
    }

    /**
     * Bulk update multiple configurations
     */
    async bulkUpdate(configs: Array<{ key: string; value: any }>): Promise<Array<SysConfig>> {
        const results: SysConfig[] = [];
        
        for (const { key, value } of configs) {
            let config = await this.configRepo.findOneBy({ key });
            if (!config) {
                config = new SysConfig();
                config.key = key;
            }
            config.value = value;
            const saved = await this.configRepo.save(config);
            this.cache[key] = value;
            results.push(saved);
        }
        
        return results;
    }

    /**
     * Delete a configuration
     */
    async delete(key: string): Promise<boolean> {
        const config = await this.configRepo.findOneBy({ key });
        if (config) {
            await this.configRepo.remove(config);
            delete this.cache[key];
            return true;
        }
        return false;
    }

    /**
     * Clear the cache for a specific key or all keys
     */
    clearCache(key?: string): void {
        if (key) {
            delete this.cache[key];
        } else {
            this.cache = {};
        }
    }

    /**
     * Check if a configuration exists
     */
    async exists(key: string): Promise<boolean> {
        const config = await this.configRepo.findOneBy({ key });
        return !!config;
    }
}
