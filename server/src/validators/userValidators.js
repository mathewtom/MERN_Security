//Schema Validation for user-facing endpoints
//Only allows updates for First Name and Last Name
//Email change and password change to be handled later

import { z } from 'zod';


export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name cannot be empty')
    .max(50, 'First name must be 50 characters or fewer'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name must be 50 characters or fewer'),
}).partial().strict().refine( //partial makes fields options, refine allows for custom validation
  // -------------------------------------------------------------------------
  // CUSTOM VALIDATION: At least one field must be present
  // -------------------------------------------------------------------------
  // Object.keys(data) returns an array of the object's own property names.
  // If the body is {} (empty), this returns []. length > 0 check ensures
  // at least one field was provided.
  //
 
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field (firstName or lastName) must be provided' }
);
