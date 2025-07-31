import { Types } from "mongoose";

export interface IAuthProvider {
     provider : "google" | "credentials",
     providerId : string,
}

export enum Role {
     USER = "USER",
     RIDER = "RIDER",
     DRIVER = "DRIVER",
     ADMIN = "ADMIN",
     SUPER_ADMIN = "SUPER_ADMIN"
}

export enum IsActive {
     ACTIVE = "ACTIVE",
     INACTIVE = "INACTIVE",
     BLOCKED = "BLOCKED",
}

export enum Gender {
     MALE = "MALE",
     FEMALE = "FEMALE",
}

export interface IUser {
     _id? : Types.ObjectId
     name: string,
     email: string,
     password: string,
     phone?: string,
     picture?: string,
     address?: string,
     dateOfDate?: string,
     gender?: Gender,
     monthlyCancelLimit?: number,
     isDeleted?: boolean,
     isActive?: IsActive,
     isVerified?: boolean,
     role: Role,
     auths: IAuthProvider[],
     rides?: Types.ObjectId[],
     createdAt?: Date
}