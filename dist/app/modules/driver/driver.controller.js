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
const approveOrRejectDriver = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const { approvalStatus } = req.body;
    if (approvalStatus === "REJECTED") {
        yield driver_service_1.DriverServices.approveOrRejectDriver(approvalStatus, userId);
        (0, sendResponse_1.sendResponse)(res, {
            success: false,
            statusCode: http_status_codes_1.default.EXPECTATION_FAILED,
            message: "Your driver application has been reviewed and unfortunately, it has been rejected.",
            data: {},
        });
    }
    else if (approvalStatus === "APPROVED") {
        const driverInformation = yield driver_service_1.DriverServices.approveOrRejectDriver(approvalStatus, userId);
        (0, sendResponse_1.sendResponse)(res, {
            success: true,
            statusCode: http_status_codes_1.default.CREATED,
            message: "You can now start accepting ride requests. Make sure to stay available and keep your profile up to date.",
            data: driverInformation,
        });
    }
}));
const getAllDrivers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield driver_service_1.DriverServices.getAllDrivers();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All Drivers Retrieved Successfully",
        data: result.data
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
    const driverId = req.params.driverId;
    const decodedToken = req.user;
    const driverStat = yield driver_service_1.DriverServices.completedRides(driverId, decodedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Single Driver State",
        data: driverStat,
    });
}));
exports.DriverControllers = {
    createDriver,
    approveOrRejectDriver,
    getAllDrivers,
    driverEarningHistory,
    singleDriverStat,
    completedRides
};
