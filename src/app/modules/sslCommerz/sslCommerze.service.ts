/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { ISSLCommerz } from "./sslCommerz.interface";
import axios from "axios";
import { Payment } from "../payment/payment.model";

interface SSLCommerzInitResponse {
  status?: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  redirectGatewayURL?: string;
  [key: string]: any;
}

const sslPaymentInit = async (payload: ISSLCommerz): Promise<SSLCommerzInitResponse> => {
  try {
    const data = {
      store_id: envVars.SSLCOMMERZ.SSL_STORE_ID,
      store_passwd: envVars.SSLCOMMERZ.SSL_STORE_PASSWORD,
      total_amount: payload.amount,
      currency: "BDT",
      tran_id: payload.transactionId,
      success_url: `${envVars.SSLCOMMERZ.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
      fail_url: `${envVars.SSLCOMMERZ.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=FAIL`,
      cancel_url: `${envVars.SSLCOMMERZ.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=CANCEL`,
      ipn_url: envVars.SSLCOMMERZ.SSL_IPN_URL,
      shipping_method: "N/A",
      product_name: "Trip",
      product_category: "Service",
      product_profile: "general",
      cus_name: payload.name,
      cus_email: payload.email,
      cus_add1: payload.address,
      cus_add2: "N/A",
      cus_city: "Shanghai",
      cus_state: "Shanghai",
      cus_postcode: "1000",
      cus_country: "China",
      cus_phone: payload.phoneNumber,
      cus_fax: "01711111111",
      ship_name: "N/A",
      ship_add1: "N/A",
      ship_add2: "N/A",
      ship_city: "N/A",
      ship_state: "N/A",
      ship_postcode: 1000,
      ship_country: "N/A",
    };

    const response = await axios({
      method: "POST",
      url: envVars.SSLCOMMERZ.SSL_PAYMENT_API,
      data: data,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data;
  } catch (error: any) {
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const validatePayment = async (payload: any) => {
  try {
    const response = await axios({
      method: "GET",
      url: `${envVars.SSLCOMMERZ.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVars.SSLCOMMERZ.SSL_STORE_ID}&store_passwd=${envVars.SSLCOMMERZ.SSL_STORE_PASSWORD}`,
    });

    await Payment.updateOne(
      { transactionId: payload.tran_id },
      { paymentGatewayData: response.data },
      { runValidators: true }
    );
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment Validation error, ${error.message}`
    );
  }
};

export const SSLService = {
  sslPaymentInit,
  validatePayment,
};
