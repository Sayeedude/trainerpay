import { z } from "zod";
import { ROLES } from "@/lib/permissions/roles";

/**
 * Server-side validation for POST /api/admin/users. Spec section 15
 * requires input validation on top of RLS — RLS controls what a query can
 * touch, this controls what shape of data we'll accept in the first place.
 */
export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(ROLES),
  employeeId: z.string().uuid().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
