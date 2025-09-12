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
const driver_model_1 = require("../driver/driver.model");
const payment_model_1 = require("../payment/payment.model");
const payment_interface_1 = require("../payment/payment.interface");
const sslCommerze_service_1 = require("../sslCommerz/sslCommerze.service");
const mongoose_1 = require("mongoose");
const queryBuilder_1 = require("../../utils/queryBuilder");
const now = new Date();
const dateSevenDaysAgo = new Date(now);
dateSevenDaysAgo.setDate(now.getDate() - 7);
const dateThirtyDaysAgo = new Date(now);
dateThirtyDaysAgo.setDate(now.getDate() - 30);
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);
const endOfToday = new Date();
endOfToday.setHours(23, 59, 59, 999);
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
        const checkAvailableOnlineDriver = yield driver_model_1.Driver.find({
            availabilityStatus: "ONLINE",
        });
        if (!checkAvailableOnlineDriver) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "your request has been pending, but no drivers are available now");
        }
        const rideInfo = {
            rider: isUserExist._id,
            pickupLocation: payload.pickupLocation,
            destinationLocation: payload.destinationLocation,
            distance: `${payload.distance} km`,
            rideRequestAction: rides_interface_1.RideRequestAction.PENDING,
            rideRequestAt: new Date(),
            originalFare: payload.originalFare,
        };
        const createRequestRide = yield rides_model_1.Ride.create([rideInfo], { session });
        //payment
        const transactionId = getTransactionId();
        const payment = yield payment_model_1.Payment.create([
            {
                ride: createRequestRide[0]._id,
                transactionId: transactionId,
                paymentMethod: payload.paymentMethod,
                status: payment_interface_1.PAYMENT_STATUS.UNPAID,
                amount: Number(payload.originalFare),
            },
        ], { session });
        yield user_model_1.User.findByIdAndUpdate(userId, { isOnTrip: true, $addToSet: { rides: createRequestRide[0]._id } }, { new: true, runValidators: true, session });
        const updatedRide = yield rides_model_1.Ride.findByIdAndUpdate(createRequestRide[0]._id, { payment: payment[0]._id }, { new: true, runValidators: true, session })
            .populate("rider", "name email phone address")
            .populate("payment");
        // SSLCOMMERZ payment process
        const rideId = createRequestRide[0]._id;
        const riderAddress = (updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider).address;
        const riderEmail = (updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider).email;
        const riderPhoneNumber = (updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider).phone;
        const riderName = (updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider).name;
        const sslPayload = {
            rideId,
            address: riderAddress,
            email: riderEmail,
            phoneNumber: riderPhoneNumber,
            name: riderName,
            amount: Number(payload.originalFare),
            transactionId: transactionId,
        };
        const sslPayment = yield sslCommerze_service_1.SSLService.sslPaymentInit(sslPayload);
        yield session.commitTransaction();
        session.endSession();
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
const rideDetails = (decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const riderId = decodedToken.userId;
    const rider = yield user_model_1.User.findById(riderId);
    const lastRideId = (_a = rider === null || rider === void 0 ? void 0 : rider.rides) === null || _a === void 0 ? void 0 : _a[rider.rides.length - 1];
    const ride = yield rides_model_1.Ride.findById(lastRideId);
    if (!ride) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (["ACCEPTED", "REJECTED"].includes(ride.rideRequestAction)) {
        // Run aggregation with lookups
        const rideDetails = yield rides_model_1.Ride.aggregate([
            {
                $match: { _id: new mongoose_1.Types.ObjectId(lastRideId) },
            },
            {
                $lookup: {
                    from: "drivers",
                    localField: "driver",
                    foreignField: "driverInformation",
                    as: "matchedDriver",
                },
            },
            { $unwind: "$matchedDriver" },
            {
                $lookup: {
                    from: "users",
                    localField: "driver",
                    foreignField: "_id",
                    as: "driverInfo",
                },
            },
            { $unwind: "$driverInfo" },
            {
                $lookup: {
                    from: "vehicleinfos",
                    localField: "matchedDriver.vehicleInfo",
                    foreignField: "_id",
                    as: "vehicleInfo",
                },
            },
            { $unwind: "$vehicleInfo" },
        ]);
        return {
            rideDetails: rideDetails[0],
            driverInfo: rideDetails[0].driverInfo,
            vehicleInfo: rideDetails[0].vehicleInfo,
        };
    }
    else {
        // Return only ride info without lookups
        return {
            rideDetails: ride,
        };
    }
});
const rideHistory = (riderId, query, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const rider = yield user_model_1.User.findById(riderId);
    if (!rider) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Rider not found");
    }
    if (riderId !== decodedToken.userId) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not authorize rider");
    }
    const user = yield user_model_1.User.findById(riderId).select("rides").lean();
    const rideIds = (user === null || user === void 0 ? void 0 : user.rides) || [];
    const queryBuilder = new queryBuilder_1.QueryBuilder(rides_model_1.Ride.find({ _id: { $in: rideIds } }).select("pickupLocation destinationLocation distance rideRequestAction rideRequestAt originalFare rideProgressStatus"), query);
    const rides = yield queryBuilder.filter().sort().fields().paginate();
    const [data, meta] = yield Promise.all([
        rides.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getAllRides = (query) => __awaiter(void 0, void 0, void 0, function* () {
    let ridesQuery = rides_model_1.Ride.find().select("pickupLocation destinationLocation distance rideRequestAction rideRequestAt originalFare");
    if (query.riderGender) {
        ridesQuery = ridesQuery.where("rider.gender").equals(query.riderGender);
    }
    const queryBuilder = new queryBuilder_1.QueryBuilder(ridesQuery, query);
    const ridesData = queryBuilder.filter().sort().fields().paginate();
    const [data, meta] = yield Promise.all([
        ridesData.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getAllRidesStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const totalRidesPromise = rides_model_1.Ride.countDocuments();
    const totalCompleteRidesPromise = rides_model_1.Ride.countDocuments({
        rideProgressStatus: "COMPLETED",
    });
    const ridesInLast7DaysPromise = rides_model_1.Ride.countDocuments({
        createdAt: { $gte: dateSevenDaysAgo },
    });
    const ridesInLast30DaysPromise = rides_model_1.Ride.countDocuments({
        createdAt: { $gte: dateThirtyDaysAgo },
    });
    const [totalRides, totalCompleteRides, ridesInLast7Days, ridesInLast30Days] = yield Promise.all([
        totalRidesPromise,
        totalCompleteRidesPromise,
        ridesInLast7DaysPromise,
        ridesInLast30DaysPromise,
    ]);
    return {
        totalRides,
        totalCompleteRides,
        ridesInLast7Days,
        ridesInLast30Days,
    };
});
exports.RideService = {
    createRide,
    cancelRide,
    riderFeedback,
    rideDetails,
    rideHistory,
    getAllRides,
    getAllRidesStats,
};
