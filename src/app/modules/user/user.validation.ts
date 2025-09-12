import z from "zod";
import { Gender, IsActive, Role } from "./user.interface";

export const createUserZodSchema = z.object({
  name: z
    .string({ error: "Name must be string" })
    .min(4, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  email: z
    .string({ error: "Email must be string" })
    .email({ message: "Invalid email address format" })
    .min(10, { message: "Email must be at least 10 characters long." })
    .max(60, { message: "Email cannot exceed 60 characters." }),
  password: z
    .string({ error: "Password must be string" })
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter.",
    })
    .regex(/^(?=.*[!@#$%^&*])/, {
      message: "Password must contain at least 1 special character.",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least 1 number.",
    }),
  phone: z
    .string({ error: "Phone Number must be string" })
    .regex(/^(?:\+8801[3-9]\d{8}|01[3-9]\d{8}|\+861[3-9]\d{9}|1[3-9]\d{9})$/, {
      message: "Phone number must be valid for Bangladesh or China.",
    })
    .optional(),
  picture: z.string({ error: "Picture must be string" }).optional(),
});

export const updateUserZodSchema = z.object({
  name: z
    .string({ error: "Name must be string" })
    .min(4, { message: "Name must be at least 4 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional(),
  phone: z
    .string({ error: "Phone Number must be string" })
    .regex(/^(?:\+8801[3-9]\d{8}|01[3-9]\d{8}|\+861[3-9]\d{9}|1[3-9]\d{9})$/, {
      message: "Phone number must be valid for Bangladesh or China.",
    })
    .optional(),
  address: z
    .string({ error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
  picture: z.string({ error: "Picture must be string" }).optional(),
  dateOfBirth: z
    .string({ error: "Date Of Birth must be string" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Invalid birth date format. Use YYYY-MM-DD.",
    })
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime()); // valid date
      },
      {
        message: "Invalid date. Please enter a real date.",
      }
    )
    .optional(),
  gender: z.enum(Object.values(Gender) as [string]).optional(),
  monthlyCancelLimit: z
    .number({ error: "Monthly cancel limitation must be number" })
    .optional(),
  isActive: z.enum(Object.values(IsActive) as [string]).optional(),
  isDeleted: z.boolean({ error: "isDeleted must be true or false" }).optional(),
  isVerified: z
    .boolean({ error: "isVerified must be true or false" })
    .optional(),
  role: z.enum(Object.values(Role) as [string]).optional(),
  // emergencyContact: z.array(
  //   z
  //     .string({ error: "Password must be string" })
  //     .email({ message: "Invalid email address format" })
  //     .min(10, { message: "Email must be at least 10 characters long." })
  //     .max(60, { message: "Email cannot exceed 60 characters." })
  // ),
});
