import { z } from 'zod';

/**
 * Mirrors `components.schemas.Address` / `Customer` in specs/parabank-openapi.yaml.
 * The spec marks every property optional; the API always returns all of them, so the
 * schemas require them. Objects are strict so unexpected fields surface as contract drift.
 */
export const AddressSchema = z.strictObject({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
});

export const CustomerSchema = z.strictObject({
  id: z.number().int().positive(),
  firstName: z.string(),
  lastName: z.string(),
  address: AddressSchema,
  phoneNumber: z.string(),
  ssn: z.string(),
});

export type Address = z.infer<typeof AddressSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
