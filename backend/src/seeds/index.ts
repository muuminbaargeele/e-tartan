import { seedAdmin, } from "../user/seeds/create-admin";
import { seedPlayer } from "../player/seeds/create-player";
import { seedRoles } from "../user/seeds/create-roles";
import { seedMobileOperators } from "../user/seeds/create-mobile-operators";
import { seedSysConfig } from "./sys-config";

import AppDataSource from "../data-source";
import { seedTournamentStatuses } from "../tournament/seeds/tournamentStatus.seed";
import { seedTournamentTypes } from "../tournament/seeds/tournamentType.seed";
import { seedSubscriptionTypes } from "../subscription/seeds/create-subscription-types";
import { seedPromo } from "../promo/seeds/seedPromo";

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

    console.log("Seeding MobileOperators...");
    await seedMobileOperators();
    console.log("MobileOperators seeded.");

    console.log("Seeding SysConfig...");
    await seedSysConfig();
    console.log("SysConfig seeded.");

    console.log("Seeding TournamentStatuse...");
    await seedTournamentStatuses();
    console.log("TournamentStatuse seeded.");

    console.log("Seeding TournamentTypes...");
    await seedTournamentTypes();
    console.log("TournamentTypes seeded.");

    console.log("Seeding SubscriptionTypes...");
    await seedSubscriptionTypes();
    console.log("SubscriptionTypes seeded.");

    console.log("Seeding Promo...");
    await seedPromo();
    console.log("Promo seeded.");

    // Add more as needed
    await AppDataSource.destroy();
    process.exit(0);
}

runAllSeeds().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
});