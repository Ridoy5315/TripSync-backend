import { Types } from "mongoose";

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}
export enum DriverAvailability {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
}

export interface IVehicleInfo {
  _id?: Types.ObjectId;
  owner: Types.ObjectId;
  brand:  string,
  model: string;
  licensePlate: string;
  color: string;
  manufacturingYear: number;
}

export interface IDriver {
  _id?: Types.ObjectId;
  driverInformation: Types.ObjectId;
  approvalStatus: ApprovalStatus;
  availabilityStatus?: DriverAvailability;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  rating?: number;
  vehicleInfo: Types.ObjectId;
  totalIncome?: string;
}
