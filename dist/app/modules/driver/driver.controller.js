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
exports.DriverControllers = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const driver_service_1 = require("./driver.service");
const sendResponse_1 = require("../../utils/sendResponse");
const createDriver = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const userId = req.params.userId;
    const vehicleInfo = yield driver_service_1.DriverServices.createDriver(req.body, userId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "User applied for be a driver Successfully",
        data: vehicleInfo,
    });
}));
const getPendingDrivers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pendingDrivers = yield driver_service_1.DriverServices.getPendingDrivers();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Pending drivers has been Retrieved successfully.",
        data: pendingDrivers,
    });
}));
const approveOrRejectDriver = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const { status } = JSON.parse(req.body.data);
    if (status === "REJECTED") {
        yield driver_service_1.DriverServices.approveOrRejectDriver(status, userId);
        (0, sendResponse_1.sendResponse)(res, {
            success: false,
            statusCode: http_status_codes_1.default.EXPECTATION_FAILED,
            message: "Driver application rejected successfully.",
            data: {},
        });
    }
    else if (status === "APPROVED") {
        const driverInformation = yield driver_service_1.DriverServices.approveOrRejectDriver(status, userId);
        (0, sendResponse_1.sendResponse)(res, {
            success: true,
            statusCode: http_status_codes_1.default.CREATED,
            message: "Driver application accepted successfully.",
            data: driverInformation,
        });
    }
}));
const getAvailabilityStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const driver = yield driver_service_1.DriverServices.getAvailabilityStatus(decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Driver availability status has been Retrieved successfully.",
        data: driver,
    });
}));
const availabilityStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const status = yield driver_service_1.DriverServices.availabilityStatus(decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Driver availability status has been changed.",
        data: status,
    });
}));
const pendingRides = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const decodedToken = req.user;
    const pendingRidesInfo = yield driver_service_1.DriverServices.pendingRides(query, decodedToken);
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
    yield driver_service_1.DriverServices.rejectRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "driver rejected this ride",
        data: {},
    });
}));
const acceptRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    const ride = yield driver_service_1.DriverServices.acceptRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "driver accepted this ride",
        data: ride,
    });
}));
const getActiveRideStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const ride = yield driver_service_1.DriverServices.getActiveRideStatus(decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Active ride has been Retrieved successfully.",
        data: ride,
    });
}));
const pickedUpRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const rideId = req.params.rideId;
    const pickedUpRiderInfo = yield driver_service_1.DriverServices.pickedUpRide(rideId, decodedToken);
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
    const inTransitInfo = yield driver_service_1.DriverServices.inTransitRide(rideId, decodedToken);
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
    const afterCompleted = yield driver_service_1.DriverServices.completedRide(rideId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "rides completed",
        data: afterCompleted,
    });
}));
const getAllDrivers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield driver_service_1.DriverServices.getAllDrivers();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All Drivers Retrieved Successfully",
        data: result.data,
    });
}));
const driverEarningHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.params.driverId;
    const earningHistory = yield driver_service_1.DriverServices.driverEarningHistory(driverId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Driver earning history",
        data: earningHistory,
    });
}));
const singleDriverStat = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.params.driverId;
    const driverStat = yield driver_service_1.DriverServices.singleDriverStat(driverId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Single Driver State",
        data: driverStat,
    });
}));
const completedRides = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const query = req.query;
    const driverStat = yield driver_service_1.DriverServices.completedRides(query, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Driver get his completed rides history successfully",
        data: driverStat,
    });
}));
exports.DriverControllers = {
    createDriver,
    getPendingDrivers,
    approveOrRejectDriver,
    getAvailabilityStatus,
    availabilityStatus,
    pendingRides,
    rejectRide,
    acceptRide,
    getActiveRideStatus,
    pickedUpRide,
    inTransitRide,
    completedRide,
    getAllDrivers,
    driverEarningHistory,
    singleDriverStat,
    completedRides,
};
