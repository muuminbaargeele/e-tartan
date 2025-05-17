import { seedAdmin } from "./create-admin";
import { seedPlayer } from "./create-player";
import { seedRoles } from "./create-roles";
import AppDataSource from "../data-source";

async function runAllSeeds() {
    await AppDataSource.initialize();

    console.log("Seeding role...");
    await seedRoles();
    console.log("Role seeded.");

    console.log("Seeding admin...");
    await seedAdmin();
    console.log("Admin seeded.");

    console.log("Seeding player...");
    await seedPlayer();
    console.log("Player seeded.");

    // Add more as needed
    await AppDataSource.destroy();
    process.exit(0);
}

runAllSeeds().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
});