import AppDataSource from "../../data-source";
import { SubscriptionType } from "../entities/subscriptionType.entity";

export async function seedSubscriptionTypes() {
  const subscriptionTypeRepo = AppDataSource.getRepository(SubscriptionType);

  const subscriptionTypes = [
    { name: "weekly", description: "Weekly subscription" },
    { name: "monthly", description: "Monthly subscription" },
    { name: "promo", description: "Promotional subscription" },
    // Add more types if needed
  ];

  for (const typeData of subscriptionTypes) {
    const exists = await subscriptionTypeRepo.findOneBy({ name: typeData.name });
    if (!exists) {
      await subscriptionTypeRepo.save(subscriptionTypeRepo.create(typeData));
      console.log(`SubscriptionType '${typeData.name}' seeded.`);
    }
  }
}