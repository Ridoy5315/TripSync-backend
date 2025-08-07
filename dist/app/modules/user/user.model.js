"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
const authProviderSchema = new mongoose_1.Schema({
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
}, {
    versionKey: false,
    _id: false,
});
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
    },
    phone: { type: String },
    picture: { type: String },
    address: { type: String },
    dateOfBirth: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    gender: { type: String },
    monthlyCancelLimit: { type: Number, required: true, default: 5 },
    cancellationResetDate: { type: Date, default: new Date() },
    isDeleted: { type: Boolean, default: false },
    isActive: {
        type: String,
        enum: Object.values(user_interface_1.IsActive),
        default: user_interface_1.IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    isOnTrip: { type: Boolean },
    role: { type: String, enum: Object.values(user_interface_1.Role), default: user_interface_1.Role.USER },
    auths: [authProviderSchema],
    rides: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Ride"
        }
    ]
}, {
    timestamps: true,
    versionKey: false,
});
exports.User = (0, mongoose_1.model)("User", userSchema);
