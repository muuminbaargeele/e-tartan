import AppDataSource from "../../data-source";
import { TournamentType } from "../entities/tournamentType.entity";

export async function seedTournamentTypes() {
  const repo = AppDataSource.getRepository(TournamentType);

  const types = [
    { name: "KNOCKOUT", description: "Single elimination knockout tournament" },
    { name: "LEAGUE", description: "Round-robin league tournament" },
    // Add more types as needed
  ];

  for (const type of types) {
    const exists = await repo.findOneBy({ name: type.name });
    if (!exists) {
      await repo.save(repo.create(type));
      console.log(`TournamentType '${type.name}' seeded.`);
    }
  }
}