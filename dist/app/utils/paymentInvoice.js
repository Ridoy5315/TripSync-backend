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
exports.generatePdf = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const generatePdf = (invoiceData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ size: "A4", margin: 50 });
            const buffer = [];
            doc.on("data", (chunk) => buffer.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffer)));
            doc.on("error", (err) => reject(err));
            // === Styles ===
            const headingFontSize = 20;
            const labelFontSize = 12;
            // const valueFontSize = 12;
            // const sectionSpacing = 15;
            // const lineHeight = 18;
            // === Header ===
            doc
                .fontSize(headingFontSize)
                .fillColor("#333333")
                .text("Payment Invoice", { align: "center" });
            doc.moveDown(1.5);
            // === Transaction Info Section ===
            doc
                .fontSize(labelFontSize)
                .fillColor("#555555")
                .text("Transaction ID:", { continued: true })
                .font("Helvetica-Bold")
                .fillColor("#000000")
                .text(` ${invoiceData.transactionId}`);
            doc
                .font("Helvetica")
                .fontSize(labelFontSize)
                .fillColor("#555555")
                .text("Booking Date:", { continued: true })
                .font("Helvetica-Bold")
                .fillColor("#000000")
                .text(` ${invoiceData.rideDate}`);
            doc
                .font("Helvetica")
                .fontSize(labelFontSize)
                .fillColor("#555555")
                .text("Customer Name:", { continued: true })
                .font("Helvetica-Bold")
                .fillColor("#000000")
                .text(` ${invoiceData.userName}`);
            doc.moveDown(1.5);
            // === Payment Summary Section ===
            doc
                .fontSize(labelFontSize)
                .fillColor("#555555")
                .text("Total Amount:", { continued: true })
                .font("Helvetica-Bold")
                .fillColor("#28a745")
                .text(` $${invoiceData.totalAmount.toFixed(2)}`);
            doc.moveDown(2);
            // === Footer / Thank You Message ===
            doc
                .fontSize(14)
                .fillColor("#007bff")
                .text("Thank you for booking with us!", { align: "center" });
            doc.moveDown();
            doc
                .fontSize(10)
                .fillColor("#999999")
                .text("Please keep this invoice for your records.", { align: "center" });
            doc.end();
        });
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Pdf creation error ${error}`);
    }
});
exports.generatePdf = generatePdf;
