import AppDataSource from "../../data-source";
import { MatchStatus } from "../entities/matchStatus.entity";

export async function seedMatchStatuses() {
  const repo = AppDataSource.getRepository(MatchStatus);
  const statuses = [
    { name: "scheduled", description: "Match scheduled, not played yet" },
    { name: "played", description: "Match played" },
    { name: "missed", description: "Match missed by both" },
    { name: "forfeit", description: "Forfeit win/loss" },
    { name: "draw", description: "Ended in draw" },
    { name: "bye", description: "Bye - no opponent" }
  ];
  for (const s of statuses) {
    const exists = await repo.findOneBy({ name: s.name });
    if (!exists) {
      await repo.save(repo.create(s));
      console.log(`Match status '${s.name}' seeded.`);
    }
  }
}