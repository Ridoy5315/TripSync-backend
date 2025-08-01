import { model, Schema } from "mongoose";
import {
  ApprovalStatus,
  DriverAvailability,
  IDriver,
  IVehicleInfo,
} from "./driver.interface";

const vehicleInfoSchema = new Schema<IVehicleInfo>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    brand: { type: String, required: true },
    model: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    manufacturingYear: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const VehicleInfo = model<IVehicleInfo>(
  "VehicleInfo",
  vehicleInfoSchema
);

const driverSchema = new Schema<IDriver>(
  {
    driverInformation: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
      required: true,
    },
    availabilityStatus: {
      type: String,
      enum: Object.values(DriverAvailability),
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    rating: { type: Number },
    vehicleInfo: {
      type: Schema.Types.ObjectId,
      ref: "VehicleInfo",
    },
    totalIncome: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

driverSchema.index({ location: "2dsphere" });

export const Driver = model<IDriver>("Driver", driverSchema);
