import { Types } from "mongoose";

export enum RideRequestAction {
  PENDING = "PENDING",
  CANCELED_BY_USER = "CANCELED",
  ACCEPTED_BY_DRIVER = "ACCEPTED",
  REJECTED_BY_DRIVER = "REJECTED",
}

export enum RideProgressStatus {
  NOT_STARTED = "NOT_STARTED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  COMPLETED = "COMPLETED",
}

export interface IRide {
  _id?: Types.ObjectId;
  rider: Types.ObjectId;
  driver: Types.ObjectId;
  pickupLocation: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  destinationLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  distance: string;
  rideRequestAction: RideRequestAction; //riders can cancel before driver click accept
  rideProgressStatus?: RideProgressStatus; //driver can update
  rideRequestAt?: Date;
  rideCanceledAt?: Date;
  rideAcceptedAt?: Date;
  rideRejectedAt?: Date;
  ridePickedUpAt?: Date;
  rideCompletedAt?: Date;
  originalFare: number;
  driverEarning?: number;
  companyEarning?: number;
  payment?: Types.ObjectId;
  riderFeedback?: string;
  driverRating?: number;
}
