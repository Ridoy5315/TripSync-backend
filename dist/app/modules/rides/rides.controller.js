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
exports.RideController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const rides_service_1 = require("./rides.service");
const createRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const userId = req.params.userId;
    const createRequestRideInfo = yield rides_service_1.RideService.createRide(req.body, userId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Your ride request has been received. We're looking for available drivers. You'll be notified once a driver accepts your request.",
        data: createRequestRideInfo,
    });
}));
const cancelRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    const createRequestRideInfo = yield rides_service_1.RideService.cancelRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Your ride request has been canceled",
        data: createRequestRideInfo,
    });
}));
const pendingRides = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const driverId = req.params.driverId;
    const pendingRidesInfo = yield rides_service_1.RideService.pendingRides(driverId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All pending rides retrieved successfully",
        data: pendingRidesInfo,
    });
}));
const rejectRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    const rejectRequestRideInfo = yield rides_service_1.RideService.rejectRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "driver rejected this ride",
        data: rejectRequestRideInfo,
    });
}));
const acceptRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    yield rides_service_1.RideService.acceptRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "driver accepted this ride",
        data: {},
    });
}));
const pickedUpRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    const pickedUpRiderInfo = yield rides_service_1.RideService.pickedUpRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "driver picked up this rider",
        data: pickedUpRiderInfo,
    });
}));
const inTransitRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    const inTransitInfo = yield rides_service_1.RideService.inTransitRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "driver in-transit",
        data: inTransitInfo,
    });
}));
const completedRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    const afterCompleted = yield rides_service_1.RideService.completedRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "rides completed",
        data: afterCompleted,
    });
}));
const riderFeedback = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    yield rides_service_1.RideService.riderFeedback(req.body, rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "you has been given feedback to driver successfully",
        data: {},
    });
}));
const rideHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const riderId = req.params.userId;
    const ridesHistory = yield rides_service_1.RideService.rideHistory(riderId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.ACCEPTED,
        message: "Rider get his ride history successfully",
        data: ridesHistory,
    });
}));
const getAllRides = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rides = yield rides_service_1.RideService.getAllRides();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.ACCEPTED,
        message: "All Riders Retrieved Successfully",
        data: rides,
    });
}));
exports.RideController = {
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
    getAllRides
};
