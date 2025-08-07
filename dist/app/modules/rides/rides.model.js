"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ride = void 0;
const mongoose_1 = require("mongoose");
const rides_interface_1 = require("./rides.interface");
const rideSchema = new mongoose_1.Schema({
    rider: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    driver: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(rides_interface_1.RideRequestAction),
        default: rides_interface_1.RideRequestAction.PENDING,
        required: true,
    },
    rideProgressStatus: {
        type: String,
        enum: Object.values(rides_interface_1.RideProgressStatus),
    },
    rideRequestAt: { type: Date },
    rideCanceledAt: { type: Date },
    rideAcceptedAt: { type: Date },
    rideRejectedAt: { type: Date },
    ridePickedUpAt: { type: Date },
    rideCompletedAt: { type: Date },
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
    payment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Payment"
    },
    riderFeedback: {
        type: String,
    },
    driverRating: {
        type: Number,
    },
}, {
    timestamps: true,
    versionKey: false,
});
rideSchema.index({ pickupLocation: "2dsphere" });
rideSchema.index({ destinationLocation: "2dsphere" });
exports.Ride = (0, mongoose_1.model)("Ride", rideSchema);
