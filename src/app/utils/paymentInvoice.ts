/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";

export interface IInvoiceData {
     transactionId: string;
     rideDate: Date;
     userName: string;
     totalAmount: number
}

export const generatePdf = async (invoiceData: IInvoiceData): Promise<Buffer<ArrayBufferLike>> => {
  try {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffer: Uint8Array[] = [];

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
  } catch (error: any) {
    throw new AppError(httpStatus.BAD_REQUEST, `Pdf creation error ${error}`);
  }
};
