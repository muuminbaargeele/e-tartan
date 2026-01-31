import { Router, Request, Response } from "express";
import { ConfigService } from "../services/config.service";
import { success, error } from "../../utils/apiResponse";
import { HttpStatus } from "../../utils/enums";
import { adminAuthMiddleware } from "../../auth/middleware/adminAuth.middleware";
import { validateDto } from "../../utils/validateDto";
import { SetConfigDto } from "../dtoes/setConfig.dto";
import { UpdateConfigDto } from "../dtoes/updateConfig.dto";
import { BulkUpdateConfigDto } from "../dtoes/bulkUpdateConfig.dto";
import logger from "../../utils/logger";

const router = Router();
const configService = new ConfigService();

// Get all configurations (Admin only)
router.get(
  "/",
  adminAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const configs = await configService.getAllWithMetadata();
      
      logger.info({ count: configs.length }, "All configurations retrieved");
      res.status(HttpStatus.OK).json(success(configs));
      return;
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Get all configurations error");
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
      );
      return;
    }
  }
);

// Get a specific configuration by key (Admin only)
router.get(
  "/:key",
  adminAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("Config key is required", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      const config = await configService.getWithMetadata(key);
      
      if (!config) {
        res.status(HttpStatus.NOT_FOUND).json(
          error(`Configuration with key '${key}' not found`, HttpStatus.NOT_FOUND)
        );
        return;
      }

      logger.info({ key }, "Configuration retrieved");
      res.status(HttpStatus.OK).json(success(config));
      return;
    } catch (err: any) {
      const user = (req as any).user;
      const { key } = req.params;
      logger.error({ err, userId: user?.id, key }, "Get configuration error");
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
      );
      return;
    }
  }
);

// Get configuration value only (Public - for non-sensitive configs)
router.get(
  "/public/:key",
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("Config key is required", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      // Only allow public access to specific non-sensitive keys
      const publicKeys = ["app_config", "tournament_rules", "match_rules"];
      if (!publicKeys.includes(key)) {
        res.status(HttpStatus.FORBIDDEN).json(
          error("This configuration is not publicly accessible", HttpStatus.FORBIDDEN)
        );
        return;
      }

      const value = await configService.get(key);
      
      if (value === null) {
        res.status(HttpStatus.NOT_FOUND).json(
          error(`Configuration with key '${key}' not found`, HttpStatus.NOT_FOUND)
        );
        return;
      }

      logger.info({ key }, "Public configuration retrieved");
      res.status(HttpStatus.OK).json(success({ key, value }));
      return;
    } catch (err: any) {
      const { key } = req.params;
      logger.error({ err, key }, "Get public configuration error");
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
      );
      return;
    }
  }
);

// Create or update a configuration (Admin only)
router.put(
  "/:key",
  adminAuthMiddleware as any,
  validateDto(UpdateConfigDto),
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const dto: UpdateConfigDto = (req as any).validatedBody;
      
      if (!key) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("Config key is required", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      const existing = await configService.exists(key);
      const config = await configService.set(key, dto.value);

      logger.info({ 
        userId: (req as any).user?.id, 
        key, 
        action: existing ? "updated" : "created" 
      }, `Configuration ${existing ? "updated" : "created"}`);
      
      res.status(existing ? HttpStatus.OK : HttpStatus.CREATED).json(
        success({
          id: config.id,
          key: config.key,
          value: config.value,
          message: existing ? "Configuration updated successfully" : "Configuration created successfully"
        })
      );
      return;
    } catch (err: any) {
      const user = (req as any).user;
      const { key } = req.params;
      logger.error({ err, userId: user?.id, key }, "Set configuration error");
      res.status(HttpStatus.BAD_REQUEST).json(
        error(err.message || "Failed to set configuration", HttpStatus.BAD_REQUEST)
      );
      return;
    }
  }
);

// Bulk update configurations (Admin only)
router.put(
  "/bulk/update",
  adminAuthMiddleware as any,
  validateDto(BulkUpdateConfigDto),
  async (req: Request, res: Response) => {
    try {
      const dto: BulkUpdateConfigDto = (req as any).validatedBody;
      
      if (!dto.configs || dto.configs.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("At least one configuration is required", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      const results = await configService.bulkUpdate(dto.configs);

      logger.info({ 
        userId: (req as any).user?.id, 
        count: results.length 
      }, "Bulk configuration update completed");
      
      res.status(HttpStatus.OK).json(
        success({
          updated: results.length,
          configs: results.map(c => ({ id: c.id, key: c.key, value: c.value })),
          message: `${results.length} configuration(s) updated successfully`
        })
      );
      return;
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Bulk update configurations error");
      res.status(HttpStatus.BAD_REQUEST).json(
        error(err.message || "Failed to update configurations", HttpStatus.BAD_REQUEST)
      );
      return;
    }
  }
);

// Delete a configuration (Admin only)
router.delete(
  "/:key",
  adminAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(HttpStatus.BAD_REQUEST).json(
          error("Config key is required", HttpStatus.BAD_REQUEST)
        );
        return;
      }

      // Prevent deletion of critical system configs
      const criticalKeys = ["tournament_rules", "match_rules", "bot_config", "ocr_config", "otp_config"];
      if (criticalKeys.includes(key)) {
        res.status(HttpStatus.FORBIDDEN).json(
          error("Cannot delete critical system configuration", HttpStatus.FORBIDDEN)
        );
        return;
      }

      const deleted = await configService.delete(key);
      
      if (!deleted) {
        res.status(HttpStatus.NOT_FOUND).json(
          error(`Configuration with key '${key}' not found`, HttpStatus.NOT_FOUND)
        );
        return;
      }

      logger.info({ 
        userId: (req as any).user?.id, 
        key 
      }, "Configuration deleted");
      
      res.status(HttpStatus.OK).json(
        success({ message: `Configuration '${key}' deleted successfully` })
      );
      return;
    } catch (err: any) {
      const user = (req as any).user;
      const { key } = req.params;
      logger.error({ err, userId: user?.id, key }, "Delete configuration error");
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
      );
      return;
    }
  }
);

// Clear cache for a specific key or all keys (Admin only)
router.post(
  "/cache/clear",
  adminAuthMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.body;
      
      configService.clearCache(key);

      logger.info({ 
        userId: (req as any).user?.id, 
        key: key || "all" 
      }, "Configuration cache cleared");
      
      res.status(HttpStatus.OK).json(
        success({ 
          message: key 
            ? `Cache cleared for key '${key}'` 
            : "All configuration cache cleared"
        })
      );
      return;
    } catch (err: any) {
      const user = (req as any).user;
      logger.error({ err, userId: user?.id }, "Clear cache error");
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error(err.message || "Server error", HttpStatus.INTERNAL_SERVER_ERROR)
      );
      return;
    }
  }
);

export default router;

