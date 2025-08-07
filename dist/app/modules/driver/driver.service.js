"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverServices = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const driver_interface_1 = require("./driver.interface");
const user_interface_1 = require("../user/user.interface");
const driver_model_1 = require("./driver.model");
const sendEmail_1 = require("../../utils/sendEmail");
const rides_model_1 = require("../rides/rides.model");
const createDriver = (payload, userId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.DRIVER) {
        if (userId !== decodedToken.userId) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not authorized");
        }
    }
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    //check if user fulfill his account or not
    if (!isUserExist.phone ||
        !isUserExist.picture ||
        !isUserExist.address ||
        !isUserExist.dateOfBirth ||
        !isUserExist.gender) {
        throw new AppError_1.default(http_status_codes_1.default.EXPECTATION_FAILED, "Please fulfill your profile first");
    }
    //check user's birth date under 21 or not
    if (isUserExist.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(isUserExist.dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthdayThisYear = today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() &&
                today.getDate() >= birthDate.getDate());
        const actualAge = hasHadBirthdayThisYear ? age : age - 1;
        if (actualAge < 21) {
            throw new AppError_1.default(http_status_codes_1.default.EXPECTATION_FAILED, "You must be at least 21 years old to apply as a driver.");
        }
    }
    if (isUserExist.role === user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You already a driver in this platform");
    }
    const driver = yield driver_model_1.Driver.create({
        driverInformation: isUserExist._id,
        approvalStatus: driver_interface_1.ApprovalStatus.PENDING,
    });
    const vehicleInfo = yield driver_model_1.VehicleInfo.create({
        owner: driver._id,
        brand: payload.brand,
        model: payload.model,
        licensePlate: payload.licensePlate,
        color: payload.color,
        manufacturingYear: payload.manufacturingYear,
    });
    driver.vehicleInfo = vehicleInfo._id;
    yield driver.save();
    return {
        driver,
        vehicleInfo,
    };
});
const approveOrRejectDriver = (approvalStatus, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (isUserExist.isActive === user_interface_1.IsActive.BLOCKED ||
        isUserExist.isActive === user_interface_1.IsActive.INACTIVE) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `User is ${isUserExist.isActive}`);
    }
    if (isUserExist.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is deleted");
    }
    if (!isUserExist.isVerified) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Your account is is not verified");
    }
    const driverInformation = yield user_model_1.User.aggregate([
        {
            $lookup: {
                from: "drivers",
                localField: "_id",
                foreignField: "driverInformation",
                as: "info",
            },
        },
        {
            $unwind: "$info",
        },
        { $match: { "info.driverInformation": isUserExist._id } },
    ]);
    const driverInfo = driverInformation[0].info;
    if (driverInfo.approvalStatus !== "PENDING") {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You haven't apply for a driver in this platform");
    }
    if (approvalStatus === "REJECTED") {
        yield driver_model_1.Driver.findByIdAndUpdate(driverInfo._id, {
            approvalStatus: driver_interface_1.ApprovalStatus.REJECTED,
        }, { new: true, runValidators: true });
        return null;
    }
    else if (approvalStatus === "APPROVED") {
        const [updatedDriverAfterApproved, updatedUserAfterApproved] = yield Promise.all([
            driver_model_1.Driver.findByIdAndUpdate(driverInfo._id, {
                approvalStatus: driver_interface_1.ApprovalStatus.APPROVED,
                availabilityStatus: driver_interface_1.DriverAvailability.OFFLINE,
                location: {
                    type: "Point",
                    coordinates: [121.4737, 31.2304], //Shanghai
                },
                rating: 0,
                totalIncome: 0,
            }, { new: true, runValidators: true }),
            user_model_1.User.findByIdAndUpdate(isUserExist._id, { role: user_interface_1.Role.DRIVER }, { new: true, runValidators: true }),
        ]);
        (0, sendEmail_1.sendEmail)({
            to: isUserExist.email,
            subject: "Your Driver Application Has Been Approved!",
            templateName: "approve-driver-email",
            templateData: {
                name: isUserExist.name,
            },
        });
        return {
            updatedDriverAfterApproved,
            updatedUserAfterApproved,
        };
    }
});
const getAllDrivers = () => __awaiter(void 0, void 0, void 0, function* () {
    // const queryBuilder = new QueryBuilder(User.find(), query);
    //   const usersData = queryBuilder
    //     .filter()
    //     .search(userSearchableFields)
    //     .sort()
    //     .fields()
    //     .paginate();
    //   const [data, meta] = await Promise.all([
    //     usersData.build(),
    //     queryBuilder.getMeta(),
    //   ]);
    const allDrivers = yield driver_model_1.Driver.find({ approvalStatus: "APPROVED" })
        .populate({
        path: "driverInformation",
        select: "name email phone address picture gender dateOfBirth",
        model: "User",
    })
        .populate({
        path: "vehicleInfo",
        select: "brand model licensePlate color manufacturingYear",
        model: "VehicleInfo",
    })
        .lean();
    const drivers = allDrivers.map((driver) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return ({
            name: (_a = driver.driverInformation) === null || _a === void 0 ? void 0 : _a.name,
            email: (_b = driver.driverInformation) === null || _b === void 0 ? void 0 : _b.email,
            phone: (_c = driver.driverInformation) === null || _c === void 0 ? void 0 : _c.phone,
            address: (_d = driver.driverInformation) === null || _d === void 0 ? void 0 : _d.address,
            dateOfBirth: (_e = driver.driverInformation) === null || _e === void 0 ? void 0 : _e.dateOfBirth,
            picture: (_f = driver.driverInformation) === null || _f === void 0 ? void 0 : _f.picture,
            gender: (_g = driver.driverInformation) === null || _g === void 0 ? void 0 : _g.gender,
            approvalStatus: driver.approvalStatus,
            rating: driver.rating,
            totalIncome: driver.totalIncome,
            vehicleInfo: {
                brand: (_h = driver.vehicleInfo) === null || _h === void 0 ? void 0 : _h.brand,
                model: (_j = driver.vehicleInfo) === null || _j === void 0 ? void 0 : _j.model,
                licensePlate: (_k = driver.vehicleInfo) === null || _k === void 0 ? void 0 : _k.licensePlate,
                color: (_l = driver.vehicleInfo) === null || _l === void 0 ? void 0 : _l.color,
                manufacturingYear: (_m = driver.vehicleInfo) === null || _m === void 0 ? void 0 : _m.manufacturingYear,
            },
        });
    });
    // const totalDrivers = await Driver.countDocuments();
    // const page = Number(this.query.page) || 1;
    // const limit = Number(this.query.limit) || 10;
    // const totalPage = Math.ceil(totalDocuments/limit)
    // return {total: totalDocuments, page, limit, totalPage}
    return {
        data: drivers,
    };
});
const driverEarningHistory = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const driverInfo = yield driver_model_1.Driver.findById(driverId);
    const earningHistory = yield rides_model_1.Ride.aggregate([
        {
            $match: {
                driver: driverInfo === null || driverInfo === void 0 ? void 0 : driverInfo.driverInformation,
            },
        },
        {
            $project: {
                rider: 1,
                pickupLocation: 1,
                destinationLocation: 1,
                distance: 1,
                rideProgressStatus: 1,
                driverRating: 1,
                riderFeedback: 1,
                driverEarning: 1,
                createdAt: 1,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "rider",
                foreignField: "_id",
                as: "riderInfo",
            },
        },
        {
            $unwind: "$riderInfo",
        },
        {
            $project: {
                rider: {
                    name: "$riderInfo.name",
                    gender: "$riderInfo.gender",
                },
                pickupLocation: 1,
                destinationLocation: 1,
                distance: 1,
                rideProgressStatus: 1,
                driverRating: 1,
                riderFeedback: 1,
                earn: { $toDouble: "$driverEarning" },
                createdAt: 1,
            },
        },
        {
            $group: {
                _id: null,
                totalEarn: { $sum: "$earn" },
                rides: { $push: "$$ROOT" },
            },
        },
        {
            $project: {
                _id: 0,
                totalEarn: 1,
                rides: 1,
            },
        },
    ]);
    return earningHistory;
});
const singleDriverStat = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findById(driverId);
    const driverStat = yield driver_model_1.Driver.aggregate([
        {
            $match: { _id: driver === null || driver === void 0 ? void 0 : driver._id },
        },
        {
            $lookup: {
                from: "users",
                localField: "driverInformation",
                foreignField: "_id",
                as: "info",
            },
        },
        {
            $unwind: "$info",
        },
        {
            $lookup: {
                from: "rides",
                localField: "driverInformation",
                foreignField: "driver",
                as: "driverRidesInfo",
            },
        },
        {
            $project: {
                name: "$info.name",
                email: "$info.email",
                _id: 0,
                totalEarn: "$totalIncome",
                rating: 1,
                completedRides: {
                    $size: {
                        $filter: {
                            input: "$driverRidesInfo",
                            as: "ride",
                            cond: { $eq: ["$$ride.rideProgressStatus", "COMPLETED"] },
                        },
                    },
                },
            },
        },
    ]);
    return driverStat;
});
const completedRides = (driverId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not authorized driver");
    }
    const isDriverExist = yield driver_model_1.Driver.findById(driverId);
    if (!isDriverExist) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "driver not found");
    }
    if ((isDriverExist.driverInformation).toString() !== decodedToken.userId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not authorized");
    }
    const rides = yield rides_model_1.Ride.find({
        driver: isDriverExist === null || isDriverExist === void 0 ? void 0 : isDriverExist.driverInformation, rideProgressStatus: "COMPLETED"
    });
    return rides;
});
exports.DriverServices = {
    createDriver,
    approveOrRejectDriver,
    getAllDrivers,
    driverEarningHistory,
    singleDriverStat,
    completedRides,
};
