import { model, Schema } from "mongoose";
import {
  IRide,
  RideProgressStatus,
  RideRequestAction,
} from "./rides.interface";

const rideSchema = new Schema<IRide>(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    destinationLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    distance: { type: String },
    rideRequestAction: {
      type: String,
      enum: Object.values(RideRequestAction),
      default: RideRequestAction.ONGOING,
      required: true,
    },
    rideProgressStatus: {
      type: String,
      enum: Object.values(RideProgressStatus),
    },
    rideRequestAt: {type: Date},
    rideCanceledAt: {type: Date},
    rideAcceptedAt: {type: Date},
    rideRejectedAt: {type: Date},
    ridePickedUpAt: {type: Date},
    rideCompletedAt: {type: Date},
    originalFare: {
      type: Number,
      required: true,
    },
    driverEarning: {
      type: Number,
    },
    companyEarning: {
      type: Number,
    },
    riderFeedback: {
      type: String,
    },
    driverRating: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rideSchema.index({ pickupLocation: "2dsphere" });
rideSchema.index({ destinationLocation: "2dsphere" });

export const Ride = model<IRide>("Ride", rideSchema);
