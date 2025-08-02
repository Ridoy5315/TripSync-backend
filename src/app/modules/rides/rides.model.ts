import { model, Schema } from "mongoose";
import {
  IRide,
  RideProgressStatus,
  RideRequestAction,
} from "./rides.interface";

const rideSchema = new Schema<IRide>({
  user: {
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
  fare: {
    type: String,
    required: true,
  },
  riderFeedback: {
    type: String,
  },
  driverRating: {
    type: Number
  },
});

rideSchema.index({ pickupLocation: "2dsphere" });
rideSchema.index({ destinationLocation: "2dsphere" });

export const Ride = model<IRide>("Ride", rideSchema);
