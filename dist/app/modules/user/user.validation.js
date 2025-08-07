"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserZodSchema = exports.createUserZodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const user_interface_1 = require("./user.interface");
exports.createUserZodSchema = zod_1.default.object({
    name: zod_1.default
        .string({ error: "Name must be string" })
        .min(4, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." }),
    email: zod_1.default
        .string({ error: "Email must be string" })
        .email({ message: "Invalid email address format" })
        .min(10, { message: "Email must be at least 10 characters long." })
        .max(60, { message: "Email cannot exceed 60 characters." }),
    password: zod_1.default
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
    // phone: z
    //   .string({ error: "Phone Number must be string" })
    //   .regex(/^(?:\+8801[3-9]\d{8}|01[3-9]\d{8}|\+861[3-9]\d{9}|1[3-9]\d{9})$/, {
    //     message: "Phone number must be valid for Bangladesh or China.",
    //   })
    //   .optional(),
});
exports.updateUserZodSchema = zod_1.default.object({
    name: zod_1.default
        .string({ error: "Name must be string" })
        .min(4, { message: "Name must be at least 4 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." })
        .optional(),
    phone: zod_1.default
        .string({ error: "Phone Number must be string" })
        .regex(/^(?:\+8801[3-9]\d{8}|01[3-9]\d{8}|\+861[3-9]\d{9}|1[3-9]\d{9})$/, {
        message: "Phone number must be valid for Bangladesh or China.",
    })
        .optional(),
    address: zod_1.default
        .string({ error: "Address must be string" })
        .max(200, { message: "Address cannot exceed 200 characters." })
        .optional(),
    picture: zod_1.default.string({ error: "Picture must be string" }).optional(),
    dateOfBirth: zod_1.default
        .string({ error: "Date Of Birth must be string" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Invalid birth date format. Use YYYY-MM-DD.",
    })
        .refine((dateStr) => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime()); // valid date
    }, {
        message: "Invalid date. Please enter a real date.",
    }).optional(),
    gender: zod_1.default.enum(Object.values(user_interface_1.Gender)).optional(),
    monthlyCancelLimit: zod_1.default
        .number({ error: "Monthly cancel limitation must be number" })
        .optional(),
    isActive: zod_1.default.enum(Object.values(user_interface_1.IsActive)).optional(),
    isDeleted: zod_1.default.boolean({ error: "isDeleted must be true or false" }).optional(),
    isVerified: zod_1.default
        .boolean({ error: "isVerified must be true or false" })
        .optional(),
    role: zod_1.default.enum(Object.values(user_interface_1.Role)).optional(),
});
