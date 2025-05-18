import AppDataSource from "../../data-source";
import { MobileOperator } from "../entities/mobileOperator.entity";
import * as fs from "fs";
import * as path from "path";

export async function seedMobileOperators() {
  const mobileOperatorRepo = AppDataSource.getRepository(MobileOperator);

  const operators = [
    { name: "Hormuud", prefixes: ["61", "77"], isActive: true },
    { name: "Somtel", prefixes: ["62", "65", "66"], isActive: false },
    { name: "Telesom", prefixes: ["63"], isActive: true },
    { name: "SomLink", prefixes: ["64"], isActive: false },
    { name: "SomNet", prefixes: ["68"], isActive: true },
    { name: "NationLink", prefixes: ["69"], isActive: false },
    { name: "Amtel", prefixes: ["71"], isActive: false },
    { name: "Golis", prefixes: ["90"], isActive: true }
  ];

  for (const operatorData of operators) {
    const exists = await mobileOperatorRepo.findOneBy({ name: operatorData.name });
    if (!exists) {
      await mobileOperatorRepo.save(mobileOperatorRepo.create(operatorData));
      console.log(`Mobile Operator '${operatorData.name}' seeded.`);
    }
  }
  writeMobilePrefixes(operators);
}

function writeMobilePrefixes(operators: { name: string, prefixes: string[] }[]) {
  const mapping: Record<string, string> = {};
  for (const operator of operators) {
    for (const prefix of operator.prefixes) {
      mapping[prefix] = operator.name;
    }
  }

  const fileContent =
    "// This file is auto-generated during mobile operator seeding.\n"
    + "export const MOBILE_PREFIXES: { [prefix: string]: string } = "
    + JSON.stringify(mapping, null, 2)
    + ";\n";
  const target = path.resolve(__dirname, "../../utils/mobilePrefixes.ts");
  fs.writeFileSync(target, fileContent, "utf-8");
  console.log("MOBILE_PREFIXES mapping written to src/utils/mobilePrefixes.ts");
}