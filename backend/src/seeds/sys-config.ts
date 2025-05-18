import AppDataSource from "../data-source";
import { SysConfig } from "../utils/entities/sysconfig.entity";

export async function seedSysConfig() {
  const repo = AppDataSource.getRepository(SysConfig);

  const configs = [
    { key: "isSmsOtpActive", value: "false" },
    { key: "isEmailOtpActive", value: "true" },
    // Add more config keys as needed
  ];

  for (const cfg of configs) {
    const exists = await repo.findOneBy({ key: cfg.key });
    if (!exists) {
      await repo.save(repo.create(cfg));
      console.log(`SysConfig '${cfg.key}' seeded.`);
    }
  }
}
