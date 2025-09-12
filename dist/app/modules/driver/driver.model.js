"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = exports.VehicleInfo = void 0;
const mongoose_1 = require("mongoose");
const driver_interface_1 = require("./driver.interface");
const vehicleInfoSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    versionKey: false,
});
exports.VehicleInfo = (0, mongoose_1.model)("VehicleInfo", vehicleInfoSchema);
const driverSchema = new mongoose_1.Schema({
    driverInformation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    approvalStatus: {
        type: String,
        enum: Object.values(driver_interface_1.ApprovalStatus),
        default: driver_interface_1.ApprovalStatus.PENDING,
        required: true,
    },
    availabilityStatus: {
        type: String,
        enum: Object.values(driver_interface_1.DriverAvailability),
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "VehicleInfo",
    },
    totalIncome: { type: Number, default: 0 },
}, {
    timestamps: true,
    versionKey: false,
});
driverSchema.index({ location: "2dsphere" });
exports.Driver = (0, mongoose_1.model)("Driver", driverSchema);
