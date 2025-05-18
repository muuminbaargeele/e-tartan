import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import AppDataSource from "../data-source";
import { MobileOperator } from "../user/entities/mobileOperator.entity";
import { MOBILE_PREFIXES } from "./mobilePrefixes";

@ValidatorConstraint({ async: true })
export class IsActiveMobilePrefix implements ValidatorConstraintInterface {
  async validate(phoneNumber: string, args: ValidationArguments) {
    // Format: 252XXYYYYYYY (must be 12 digits, starts with 252)
    const match = phoneNumber.match(/^252(\d{2})\d{7}$/);
    if (!match) return true;
    const prefix = match[1];

    // Query DB for all active operators and collect their prefixes
    const repo = AppDataSource.getRepository(MobileOperator);
    const activeOperators = await repo.find({ where: { isActive: true } });
    const allowedPrefixes = activeOperators.flatMap(op => op.prefixes);

    return allowedPrefixes.includes(prefix);
  }

  defaultMessage(args: ValidationArguments) {
    const phoneNumber = args.value as string;
    const match = phoneNumber.match(/^252(\d{2})\d{7}$/);
    const prefix = match ? match[1] : undefined;

    if (prefix && MOBILE_PREFIXES[prefix]) {
      return `Phone number is not active, you can't use ${MOBILE_PREFIXES[prefix]} phone number.`;
    }
    return "Phone number prefix is not from an active mobile operator.";
  }
}