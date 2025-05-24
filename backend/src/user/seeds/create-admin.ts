import AppDataSource from "../../data-source";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity"; // <-- fixed import
import { hashPassword } from "../../utils/password";

export async function seedAdmin() {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);

  // Find the admin role in Role table
  const adminRole = await roleRepo.findOneBy({ name: "admin" });
  if (!adminRole) {
    console.log("Admin role missing. Run the role seed first!");
    return;
  }

  // Check if admin already exists (prevent duplicates)
  const existing = await userRepo.findOneBy({ username: "admin" });
  if (existing) {
    console.log("Admin user already exists. Skipping seed.");
    return;
  }

  // Create admin user with hashed password
  const passwordHash = await hashPassword("admin123");
  const admin = userRepo.create({
    username: "admin",
    phoneNumber: "252612126698",
    passwordHash,
    isActive: true,
    role: adminRole,
    firstName: "Super",
    middleName: null,
    lastName: "Admin",
    email: "djkhaled7276@example.com",
    verifiedViaEmail: true,
    verifiedViaSms: true
  });

  await userRepo.save(admin);
  console.log("Admin user seeded!");
}

// Only run if called directly (not imported)
if (require.main === module) {
  seedAdmin().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}