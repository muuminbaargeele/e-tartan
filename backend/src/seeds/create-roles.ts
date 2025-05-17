import AppDataSource from "../data-source";
import { Role } from "../user/entities/role.entity"; // <-- fixed import

export async function seedRoles() {
  const roleRepo = AppDataSource.getRepository(Role);

  const roles = [
    { name: "admin", description: "Administrator" },
    { name: "player", description: "Regular Player" },
    // Add more roles if needed
  ];

  for (const roleData of roles) {
    const exists = await roleRepo.findOneBy({ name: roleData.name });
    if (!exists) {
      await roleRepo.save(roleRepo.create(roleData));
      console.log(`Role '${roleData.name}' seeded.`);
    }
  }
}