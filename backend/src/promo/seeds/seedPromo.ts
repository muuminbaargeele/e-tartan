import AppDataSource from "../../data-source";
import { DiscountType } from "../entities/discountType.entity";
import { PromoCode } from "../entities/promoCode.entity";

export async function seedPromo() {
  const discountTypeRepo = AppDataSource.getRepository(DiscountType);
  const promoRepo = AppDataSource.getRepository(PromoCode);

  // Seed DiscountTypes first
  const discountTypes = [
    { name: "percentage", description: "Percentage discount" },
    { name: "amount", description: "Fixed amount discount" }
  ];
  for (const dt of discountTypes) {
    const exists = await discountTypeRepo.findOneBy({ name: dt.name });
    if (!exists) {
      await discountTypeRepo.save(discountTypeRepo.create(dt));
      console.log(`DiscountType '${dt.name}' seeded.`);
    }
  }

  // Get IDs for the types
  const percentage = await discountTypeRepo.findOneBy({ name: "percentage" });
  const amount = await discountTypeRepo.findOneBy({ name: "amount" });

  // Seed PromoCodes with full (100%) discount and others
  const promos = [
    {
      code: "FREE100",
      discountTypeId: percentage?.id,
      value: 100,
      description: "100% off everything",
      isActive: true
    },
    {
      code: "WELCOME10",
      discountTypeId: amount?.id,
      value: 10,
      description: "$10 off for new players",
      isActive: true
    }
  ];
  for (const promo of promos) {
    const exists = await promoRepo.findOneBy({ code: promo.code });
    if (!exists) {
      await promoRepo.save(promoRepo.create(promo));
      console.log(`Promo code '${promo.code}' seeded.`);
    }
  }
}