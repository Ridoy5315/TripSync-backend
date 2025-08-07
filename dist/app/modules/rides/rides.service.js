"use strict";
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
exports.RideService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const user_interface_1 = require("../user/user.interface");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const rides_model_1 = require("./rides.model");
const rides_interface_1 = require("./rides.interface");
const findDistanceBetweenLocation_1 = require("../../utils/findDistanceBetweenLocation");
const fareForRide_1 = require("../../utils/fareForRide");
const driver_interface_1 = require("../driver/driver.interface");
const driver_model_1 = require("../driver/driver.model");
const payment_model_1 = require("../payment/payment.model");
const payment_interface_1 = require("../payment/payment.interface");
const sslCommerze_service_1 = require("../sslCommerz/sslCommerze.service");
const getTransactionId = () => {
    return `tran_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};
const createRide = (payload, userId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield rides_model_1.Ride.startSession();
    session.startTransaction();
    try {
        if (decodedToken.role === user_interface_1.Role.USER ||
            decodedToken.role === user_interface_1.Role.ADMIN ||
            decodedToken.role === user_interface_1.Role.SUPER_ADMIN ||
            decodedToken.role === user_interface_1.Role.DRIVER) {
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
        if (isUserExist.isOnTrip) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are already on a trip. Please complete it before requesting another.");
        }
        const distance = (0, findDistanceBetweenLocation_1.distanceInKm)(payload);
        const originalFare = (0, fareForRide_1.rideFare)(distance);
        const rideInfo = {
            rider: isUserExist._id,
            pickupLocation: payload.pickupLocation,
            destinationLocation: payload.destinationLocation,
            distance: `${distance.toFixed(1)} km`,
            rideRequestAction: rides_interface_1.RideRequestAction.PENDING,
            rideRequestAt: new Date(),
            originalFare,
        };
        const createRequestRide = yield rides_model_1.Ride.create([rideInfo], { session });
        //payment
        const transactionId = getTransactionId();
        const payment = yield payment_model_1.Payment.create([
            {
                ride: createRequestRide[0]._id,
                transactionId: transactionId,
                status: payment_interface_1.PAYMENT_STATUS.UNPAID,
                amount: Number(originalFare),
            },
        ], { session });
        yield user_model_1.User.findByIdAndUpdate(userId, { isOnTrip: true, $addToSet: { rides: createRequestRide[0]._id } }, { new: true, runValidators: true, session });
        const updatedRide = yield rides_model_1.Ride.findByIdAndUpdate(createRequestRide[0]._id, { payment: payment[0]._id }, { new: true, runValidators: true, session })
            .populate("rider", "name email phone address")
            .populate("payment");
        // SSLCOMMERZ payment process
        const riderAddress = (updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider).address;
        const riderEmail = (updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider).email;
        const riderPhoneNumber = (updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider).phone;
        const riderName = (updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider).name;
        const sslPayload = {
            address: riderAddress,
            email: riderEmail,
            phoneNumber: riderPhoneNumber,
            name: riderName,
            amount: Number(originalFare),
            transactionId: transactionId,
        };
        const sslPayment = yield sslCommerze_service_1.SSLService.sslPaymentInit(sslPayload);
        yield session.commitTransaction();
        session.endSession();
        const checkAvailableOnlineDriver = yield driver_model_1.Driver.find({
            availabilityStatus: "ONLINE",
        });
        if (!checkAvailableOnlineDriver ||
            checkAvailableOnlineDriver.length === 0) {
            return {
                paymentUrl: sslPayment.GatewayPageURL,
                ride: updatedRide,
                message: "your request has been pending, but no drivers are available now",
            };
        }
        return {
            paymentUrl: sslPayment.GatewayPageURL,
            ride: updatedRide,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const cancelRide = (rideId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const isRideExist = yield rides_model_1.Ride.findById(rideId);
    if (!isRideExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    const fullRideInfo = yield rides_model_1.Ride.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "rider",
                foreignField: "_id",
                as: "userInfo",
            },
        },
        {
            $unwind: "$userInfo",
        },
        { $match: { "userInfo._id": isRideExist === null || isRideExist === void 0 ? void 0 : isRideExist.rider } },
    ]);
    const userId = fullRideInfo[0].userInfo._id.toString();
    if (decodedToken.role === user_interface_1.Role.USER ||
        decodedToken.role === user_interface_1.Role.ADMIN ||
        decodedToken.role === user_interface_1.Role.SUPER_ADMIN ||
        decodedToken.role === user_interface_1.Role.DRIVER) {
        if (userId !== decodedToken.userId) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not authorized");
        }
    }
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (isRideExist.rideRequestAction != rides_interface_1.RideRequestAction.PENDING) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You can't cancel this ride in this moment");
    }
    //check cancellation limit exceeded or not for this limit
    const now = new Date();
    if (!isUserExist.cancellationResetDate ||
        isUserExist.cancellationResetDate.getMonth() !== now.getMonth() ||
        isUserExist.cancellationResetDate.getFullYear() !== now.getFullYear()) {
        isUserExist.monthlyCancelLimit = 5;
        isUserExist.cancellationResetDate = now;
    }
    if (isUserExist.monthlyCancelLimit <= 0) {
        throw new Error("Cancellation limit exceeded for this month");
    }
    isUserExist.monthlyCancelLimit -= 1;
    yield isUserExist.save();
    const createRequestRide = yield rides_model_1.Ride.findByIdAndUpdate(rideId, {
        rideRequestAction: rides_interface_1.RideRequestAction.CANCELED_BY_USER,
        rideCanceledAt: new Date(),
    }, { new: true, runValidators: true });
    yield user_model_1.User.findByIdAndUpdate(userId, { isOnTrip: false }, { new: true, runValidators: true });
    return createRequestRide;
});
const pendingRides = (driverId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cant to check the pending rides");
    }
    const isExistDriver = yield driver_model_1.Driver.findById(driverId);
    if (!isExistDriver) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver not found");
    }
    if (decodedToken.userId !== isExistDriver.driverInformation.toString()) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not a valid driver");
    }
    const allPendingRides = yield rides_model_1.Ride.find({
        rideRequestAction: rides_interface_1.RideRequestAction.PENDING,
    });
    return allPendingRides;
});
const rejectRide = (rideId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const driver = yield user_model_1.User.findById(decodedToken.userId);
    if ((driver === null || driver === void 0 ? void 0 : driver.role) !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not a driver");
    }
    const driverInfo = yield user_model_1.User.aggregate([
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
        { $match: { "info.driverInformation": driver === null || driver === void 0 ? void 0 : driver._id } },
    ]);
    const driverInformationId = (_a = driverInfo[0]) === null || _a === void 0 ? void 0 : _a.info;
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.approvalStatus) !== driver_interface_1.ApprovalStatus.APPROVED) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not authorized driver");
    }
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.availabilityStatus) !== driver_interface_1.DriverAvailability.ONLINE) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not in online");
    }
    const isRideExist = yield rides_model_1.Ride.findById(rideId);
    if (!isRideExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (isRideExist.rideRequestAction === rides_interface_1.RideRequestAction.CANCELED_BY_USER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Rider already canceled this ride");
    }
    const rejectRequestRide = yield rides_model_1.Ride.findByIdAndUpdate(rideId, {
        driver: driver._id,
        rideRequestAction: rides_interface_1.RideRequestAction.REJECTED_BY_DRIVER,
        rideRejectedAt: new Date(),
    }, { new: true, runValidators: true });
    const riderInformation = yield rides_model_1.Ride.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "rider",
                foreignField: "_id",
                as: "personalInfo",
            },
        },
        { $unwind: "$personalInfo" },
        { $match: { "personalInfo._id": isRideExist.rider } },
    ]);
    const riderPersonalInformation = riderInformation[0].personalInfo;
    yield user_model_1.User.findByIdAndUpdate(riderPersonalInformation._id, { isOnTrip: false }, { new: true, runValidators: true });
    return rejectRequestRide;
});
const acceptRide = (rideId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const driver = yield user_model_1.User.findById(decodedToken.userId);
    if ((driver === null || driver === void 0 ? void 0 : driver.role) !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not a driver");
    }
    const driverInfo = yield user_model_1.User.aggregate([
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
        { $match: { "info.driverInformation": driver === null || driver === void 0 ? void 0 : driver._id } },
    ]);
    const driverInformationId = (_a = driverInfo[0]) === null || _a === void 0 ? void 0 : _a.info;
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.approvalStatus) !== driver_interface_1.ApprovalStatus.APPROVED) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not authorized driver");
    }
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.availabilityStatus) !== driver_interface_1.DriverAvailability.ONLINE) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not in online");
    }
    const isRideExist = yield rides_model_1.Ride.findById(rideId);
    if (!isRideExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (isRideExist.rideRequestAction === rides_interface_1.RideRequestAction.CANCELED_BY_USER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "rider already canceled this ride");
    }
    if (isRideExist.rideRequestAction === rides_interface_1.RideRequestAction.REJECTED_BY_DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "you already reject this ride");
    }
    yield rides_model_1.Ride.findByIdAndUpdate(rideId, {
        driver: driver._id,
        rideRequestAction: rides_interface_1.RideRequestAction.ACCEPTED_BY_DRIVER,
        rideProgressStatus: rides_interface_1.RideProgressStatus.NOT_STARTED,
        rideAcceptedAt: new Date(),
    }, { new: true, runValidators: true });
    yield driver_model_1.Driver.findOneAndUpdate({ driverInformation: driver._id }, { availabilityStatus: driver_interface_1.DriverAvailability.ON_TRIP }, { new: true, runValidators: true });
    return {};
});
const pickedUpRide = (rideId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const driver = yield user_model_1.User.findById(decodedToken.userId);
    if ((driver === null || driver === void 0 ? void 0 : driver.role) !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not a driver");
    }
    const driverInfo = yield user_model_1.User.aggregate([
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
        { $match: { "info.driverInformation": driver === null || driver === void 0 ? void 0 : driver._id } },
    ]);
    const driverInformationId = (_a = driverInfo[0]) === null || _a === void 0 ? void 0 : _a.info;
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.approvalStatus) !== driver_interface_1.ApprovalStatus.APPROVED) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not authorized driver");
    }
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.availabilityStatus) !== driver_interface_1.DriverAvailability.ON_TRIP) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not in online");
    }
    const isRideExist = yield rides_model_1.Ride.findById(rideId);
    if (!isRideExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (isRideExist.rideProgressStatus !== rides_interface_1.RideProgressStatus.NOT_STARTED) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "please accept the ride first");
    }
    const pickedUpRide = yield rides_model_1.Ride.findByIdAndUpdate(rideId, {
        rideProgressStatus: rides_interface_1.RideProgressStatus.PICKED_UP,
        ridePickedUpAt: new Date(),
    }, { new: true, runValidators: true });
    return pickedUpRide;
});
const inTransitRide = (rideId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const driver = yield user_model_1.User.findById(decodedToken.userId);
    if ((driver === null || driver === void 0 ? void 0 : driver.role) !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not a driver");
    }
    const driverInfo = yield user_model_1.User.aggregate([
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
        { $match: { "info.driverInformation": driver === null || driver === void 0 ? void 0 : driver._id } },
    ]);
    const driverInformationId = (_a = driverInfo[0]) === null || _a === void 0 ? void 0 : _a.info;
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.approvalStatus) !== driver_interface_1.ApprovalStatus.APPROVED) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not authorized driver");
    }
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.availabilityStatus) !== driver_interface_1.DriverAvailability.ON_TRIP) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not in online");
    }
    const isRideExist = yield rides_model_1.Ride.findById(rideId);
    if (!isRideExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (isRideExist.rideProgressStatus === rides_interface_1.RideProgressStatus.PICKED_UP) {
        const inTransitRide = yield rides_model_1.Ride.findByIdAndUpdate(rideId, {
            rideProgressStatus: rides_interface_1.RideProgressStatus.IN_TRANSIT,
        }, { new: true, runValidators: true });
        return inTransitRide;
    }
    else {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "please pick up the rider first");
    }
});
const completedRide = (rideId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const driver = yield user_model_1.User.findById(decodedToken.userId);
    if ((driver === null || driver === void 0 ? void 0 : driver.role) !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not a driver");
    }
    const driverInfo = yield user_model_1.User.aggregate([
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
        { $match: { "info.driverInformation": driver === null || driver === void 0 ? void 0 : driver._id } },
    ]);
    const driverInformationId = (_a = driverInfo[0]) === null || _a === void 0 ? void 0 : _a.info;
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.approvalStatus) !== driver_interface_1.ApprovalStatus.APPROVED) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not authorized driver");
    }
    if ((driverInformationId === null || driverInformationId === void 0 ? void 0 : driverInformationId.availabilityStatus) !== driver_interface_1.DriverAvailability.ON_TRIP) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not in online");
    }
    const isRideExist = yield rides_model_1.Ride.findById(rideId);
    if (!isRideExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    const riderInformation = yield rides_model_1.Ride.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "rider",
                foreignField: "_id",
                as: "personalInfo",
            },
        },
        { $unwind: "$personalInfo" },
        { $match: { "personalInfo._id": isRideExist.rider } },
    ]);
    const riderPersonalInformation = riderInformation[0].personalInfo;
    if (isRideExist.rideProgressStatus === rides_interface_1.RideProgressStatus.IN_TRANSIT) {
        const completedRide = yield rides_model_1.Ride.findByIdAndUpdate(rideId, {
            rideProgressStatus: rides_interface_1.RideProgressStatus.COMPLETED,
            rideCompletedAt: new Date(),
            driverEarning: (Number(isRideExist.originalFare) * 0.8).toFixed(2),
            companyEarning: (Number(isRideExist.originalFare) * (1 - 0.8)).toFixed(2),
            riderFeedback: "",
            driverRating: null,
        }, { new: true, runValidators: true });
        const driverTotalIncome = Number(driverInformationId.totalIncome) +
            Number(completedRide === null || completedRide === void 0 ? void 0 : completedRide.driverEarning);
        const updateDriverInfo = yield driver_model_1.Driver.findByIdAndUpdate(driverInformationId._id, {
            availabilityStatus: driver_interface_1.DriverAvailability.ONLINE,
            totalIncome: driverTotalIncome.toFixed(2),
        }, { new: true, runValidators: true });
        const updatedRiderPersonalInfo = yield user_model_1.User.findByIdAndUpdate(riderPersonalInformation._id, { isOnTrip: false }, { new: true, runValidators: true });
        return {
            completedRide,
            updateDriverInfo,
            updatedRiderPersonalInfo,
        };
    }
    else {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "please pick up the rider first");
    }
});
const riderFeedback = (payload, rideId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const riderId = decodedToken.userId;
    const ride = yield rides_model_1.Ride.findById(rideId);
    if (!ride) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (riderId !== ride.rider.toString()) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not correct rider");
    }
    yield rides_model_1.Ride.findByIdAndUpdate(rideId, {
        driverRating: payload.driverRating
            ? payload.driverRating
            : ride.driverRating,
        riderFeedback: payload.riderFeedback
            ? payload.riderFeedback
            : ride.riderFeedback,
    }, { new: true, runValidators: true });
    const ratingAggregation = yield rides_model_1.Ride.aggregate([
        {
            $match: {
                driver: ride.driver,
                rideProgressStatus: "COMPLETED",
                driverRating: { $exists: true, $ne: null },
            },
        },
        {
            $group: {
                _id: "$driver",
                averageRating: { $avg: "$driverRating" },
            },
        },
    ]);
    yield driver_model_1.Driver.findOneAndUpdate({ driverInformation: ride.driver }, { rating: ratingAggregation[0].averageRating.toFixed(1) }, { new: true, runValidators: true });
});
const rideHistory = (riderId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const rider = yield user_model_1.User.findById(riderId);
    if (!rider) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Rider not found");
    }
    if (riderId !== decodedToken.userId) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not authorize rider");
    }
    const completedRides = yield user_model_1.User.findById(riderId).populate({
        path: "rides",
        match: { rideProgressStatus: "COMPLETED" },
        select: "pickupLocation destinationLocation rideRequestAt rideAcceptedAt ridePickedUpAt rideCompletedAt originalFare driverRating riderFeedback",
    });
    const ridesHistory = {
        name: rider.name,
        email: rider.email,
        rides: completedRides === null || completedRides === void 0 ? void 0 : completedRides.rides,
    };
    return ridesHistory;
});
const getAllRides = () => __awaiter(void 0, void 0, void 0, function* () {
    const allRides = yield rides_model_1.Ride.find()
        .populate({
        path: "rider",
        select: "name email phone address picture gender",
        model: "User",
    })
        .populate({
        path: "driver",
        select: "name email phone address picture gender",
        model: "User",
    })
        .lean();
    const rides = allRides.map((ride) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return ({
            pickupLocation: ride.pickupLocation,
            destinationLocation: ride.destinationLocation,
            rideProgressStatus: ride.rideProgressStatus,
            fare: ride.originalFare,
            rider: {
                name: (_a = ride.rider) === null || _a === void 0 ? void 0 : _a.name,
                email: (_b = ride.rider) === null || _b === void 0 ? void 0 : _b.email,
                phone: (_c = ride.rider) === null || _c === void 0 ? void 0 : _c.phone,
                address: (_d = ride.rider) === null || _d === void 0 ? void 0 : _d.address,
                picture: (_e = ride.rider) === null || _e === void 0 ? void 0 : _e.picture,
                gender: (_f = ride.rider) === null || _f === void 0 ? void 0 : _f.gender,
            },
            driver: {
                name: (_g = ride.driver) === null || _g === void 0 ? void 0 : _g.name,
                email: (_h = ride.driver) === null || _h === void 0 ? void 0 : _h.email,
                phone: (_j = ride.driver) === null || _j === void 0 ? void 0 : _j.phone,
                address: (_k = ride.driver) === null || _k === void 0 ? void 0 : _k.address,
                picture: (_l = ride.driver) === null || _l === void 0 ? void 0 : _l.picture,
                gender: (_m = ride.driver) === null || _m === void 0 ? void 0 : _m.gender,
            },
        });
    });
    return rides;
});
exports.RideService = {
    createRide,
    cancelRide,
    pendingRides,
    rejectRide,
    acceptRide,
    pickedUpRide,
    inTransitRide,
    completedRide,
    riderFeedback,
    rideHistory,
    getAllRides,
};
