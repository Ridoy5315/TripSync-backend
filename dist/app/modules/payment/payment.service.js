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
exports.PaymentService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const rides_interface_1 = require("../rides/rides.interface");
const rides_model_1 = require("../rides/rides.model");
const payment_interface_1 = require("./payment.interface");
const payment_model_1 = require("./payment.model");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const sslCommerze_service_1 = require("../sslCommerz/sslCommerze.service");
const paymentInvoice_1 = require("../../utils/paymentInvoice");
const sendEmail_1 = require("../../utils/sendEmail");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const initPayment = (rideId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findOne({ ride: rideId });
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Payment not found. You have not request this ride");
    }
    const ride = yield rides_model_1.Ride.findById(payment.ride).populate("rider", "name email address phone");
    const userAddress = (ride === null || ride === void 0 ? void 0 : ride.rider).address;
    const userEmail = (ride === null || ride === void 0 ? void 0 : ride.rider).email;
    const userPhoneNumber = (ride === null || ride === void 0 ? void 0 : ride.rider).phone;
    const userName = (ride === null || ride === void 0 ? void 0 : ride.rider).name;
    const sslPayload = {
        rideId: payment.ride,
        name: userName,
        email: userEmail,
        address: userAddress,
        phoneNumber: userPhoneNumber,
        amount: payment.amount,
        transactionId: payment.transactionId,
    };
    const sslPayment = yield sslCommerze_service_1.SSLService.sslPaymentInit(sslPayload);
    const updatedRide = yield rides_model_1.Ride.findByIdAndUpdate(payment.ride, { rideRequestAction: rides_interface_1.RideRequestAction.PENDING }, { new: true, runValidators: true });
    yield user_model_1.User.findByIdAndUpdate(updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider, { isOnTrip: true }, { new: true, runValidators: true });
    return {
        payment: sslPayment.GatewayPageURL,
    };
});
const successPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield rides_model_1.Ride.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.PAID,
        }, { new: true, runValidators: true, session });
        const ride = yield rides_model_1.Ride.findById(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.ride).populate("rider", "name email");
        const invoiceData = {
            transactionId: updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.transactionId,
            rideDate: ride === null || ride === void 0 ? void 0 : ride.createdAt,
            userName: (ride === null || ride === void 0 ? void 0 : ride.rider).name,
            totalAmount: ride === null || ride === void 0 ? void 0 : ride.originalFare,
        };
        const pdfBuffer = yield (0, paymentInvoice_1.generatePdf)(invoiceData);
        const cloudinaryResult = yield (0, cloudinary_config_1.uploadBufferToCloudinary)(pdfBuffer, "payment invoice");
        if (!cloudinaryResult) {
            throw new AppError_1.default(401, "Error uploading pdf");
        }
        yield payment_model_1.Payment.findByIdAndUpdate(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment._id, { invoiceUrl: cloudinaryResult.secure_url }, { runValidators: true, session });
        yield (0, sendEmail_1.sendEmail)({
            to: (ride === null || ride === void 0 ? void 0 : ride.rider).email,
            subject: "Your payment Invoice",
            templateName: "paymentInvoice",
            templateData: invoiceData,
            attachments: [
                {
                    filename: "payment invoice.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });
        yield session.commitTransaction(); //transaction
        session.endSession();
        return { success: true, message: "Payment Completed Successfully" };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const failPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield rides_model_1.Ride.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.FAILED,
        }, { session });
        const updatedRide = yield rides_model_1.Ride.findByIdAndUpdate(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.ride, { rideRequestAction: rides_interface_1.RideRequestAction.CANCELED_BY_USER }, { new: true, runValidators: true, session });
        yield user_model_1.User.findByIdAndUpdate(updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider, { isOnTrip: false }, { new: true, runValidators: true, session });
        yield session.commitTransaction(); //transaction
        session.endSession();
        return { success: false, message: "Payment Failed" };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const cancelPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield rides_model_1.Ride.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.CANCELLED,
        }, { session });
        const updatedRide = yield rides_model_1.Ride.findByIdAndUpdate(updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.ride, { rideRequestAction: rides_interface_1.RideRequestAction.CANCELED_BY_USER }, { new: true, runValidators: true, session });
        yield user_model_1.User.findByIdAndUpdate(updatedRide === null || updatedRide === void 0 ? void 0 : updatedRide.rider, { isOnTrip: false }, { new: true, runValidators: true, session });
        yield session.commitTransaction(); //transaction
        session.endSession();
        return { success: false, message: "Payment Cancelled" };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const getInvoiceDownloadUrl = (paymentId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = decodedToken.userId;
    // const email = decodedToken.email;
    const payment = yield payment_model_1.Payment.findById(paymentId)
        .select("invoiceUrl ride").populate({
        path: "ride",
        select: "rider",
        populate: { path: "rider", model: "User" }
    })
        .orFail(new Error("Payment Not Found"));
    if (!payment) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Payment not found");
    }
    if (!payment.invoiceUrl) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "no invoice found");
    }
    if ((payment.ride.rider._id).toString() !== userId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not authorized");
    }
    return payment.invoiceUrl;
});
exports.PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
};
