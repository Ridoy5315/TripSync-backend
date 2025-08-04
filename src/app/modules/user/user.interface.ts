import { Types } from "mongoose";

export interface IAuthProvider {
     provider : "google" | "credentials",
     providerId : string,
}

export enum Role {
     USER = "USER",
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
     password?: string,
     phone?: string,
     picture?: string,
     address?: string,
     dateOfBirth?: string,
     gender?: Gender,
     monthlyCancelLimit?: number,
     cancellationResetDate?: Date,
     isDeleted?: boolean,
     isActive?: IsActive,
     isVerified?: boolean,
     isOnTrip?: boolean,
     role: Role,
     auths: IAuthProvider[],
     rides?: Types.ObjectId[],
     createdAt?: Date
}