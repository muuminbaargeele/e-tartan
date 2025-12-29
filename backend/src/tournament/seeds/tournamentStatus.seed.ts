import AppDataSource from "../../data-source";
import { TournamentStatus } from "../entities/tournamentStatus.entity";

export async function seedTournamentStatuses() {
  const repo = AppDataSource.getRepository(TournamentStatus);

  const statuses = [
    { name: "UPCOMING", description: "Tournament yet to start" },
    { name: "OPEN", description: "Registration open" },
    { name: "REGISTRATION_CLOSED", description: "Registration closed, waiting to start" },
    { name: "ONGOING", description: "Tournament currently running" },
    { name: "COMPLETED", description: "Tournament completed" },
    { name: "CANCELLED", description: "Tournament cancelled" }
  ];

  for (const status of statuses) {
    const exists = await repo.findOneBy({ name: status.name });
    if (!exists) {
      await repo.save(repo.create(status));
      console.log(`TournamentStatus '${status.name}' seeded.`);
    }
  }
}