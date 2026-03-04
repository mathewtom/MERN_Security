//Validation Schemas applied to any traffic to auth endpoints

//Validation Rules: .trim to remove whitespace, .toLowerCase(), .min() & .max() for length, .regex() for pattern requirements
//Allow only necessary fields (don't allow fields like role to pass validation)

import { z } from 'zod';

const emailField = z
    .string({ required_error: 'Email Required' })
    .email('Invalid email format')
    .max(254, 'Email must be 254 characters or less')
    .trim()
    .toLowerCase();

const passwordField = z
    .string({ required_error : 'Password Required'})
    .min(8, 'Password must be 8 characters')
    .max(128, 'Password less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const firstNameField = z
    .string({ required_error : 'First Name required'})
    .trim()
    .min(1, 'First Name cannot be empty')
    .max(50, 'First Name must be 50 characters or less');

const lastNameField = z 
    .string({ required_error : 'Last name required'})
    .trim()
    .min(1, 'Last Name cannot be empty')
    .max(50, 'Last Name must be 50 characters or less');

//Registration Schema. .strict is important because this causes the entire request to be dropped
export const registerSchema = z.object({
    email: emailField,
    password: passwordField,
    firstName: firstNameField,
    lastName: lastNameField,
}).strict();

//LoginSchema

export const loginSchema = z.object({
    email: emailField,
    password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password cannot be empty'),
}).strict();

