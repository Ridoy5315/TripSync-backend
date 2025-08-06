/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { RideRequestAction } from "../rides/rides.interface";
import { Ride } from "../rides/rides.model";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerze.service";

const initPayment = async (rideId: string) => {
  const payment = await Payment.findOne({ ride: rideId });

  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Payment not found. You have not request this ride"
    );
  }

  const ride = await Ride.findById(payment.ride).populate("rider", "name email address phone");

  const userAddress = (ride?.rider as any).address;
  const userEmail = (ride?.rider as any).email;
  const userPhoneNumber = (ride?.rider as any).phone;
  const userName = (ride?.rider as any).name;

  const sslPayload: ISSLCommerz = {
    name: userName,
    email: userEmail,
    address: userAddress,
    phoneNumber: userPhoneNumber,
    amount: payment.amount,
    transactionId: payment.transactionId,
  };

  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  const updatedRide = await Ride.findByIdAndUpdate(
      payment.ride,
      { rideRequestAction: RideRequestAction.PENDING },
      { new: true, runValidators: true }
    );

    await User.findByIdAndUpdate(
      updatedRide?.rider,
      { isOnTrip: true },
      { new: true, runValidators: true }
    );

  return {
    payment: sslPayment.GatewayPageURL,
  };
};

const successPayment = async (query: Record<string, string>) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      {
        status: PAYMENT_STATUS.PAID,
      },
      { session }
    );

    await session.commitTransaction(); //transaction
    session.endSession();
    return { success: true, message: "Payment Completed Successfully" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const failPayment = async (query: Record<string, string>) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      {
        status: PAYMENT_STATUS.FAILED,
      },
      { session }
    );

    const updatedRide = await Ride.findByIdAndUpdate(
      updatedPayment?.ride,
      { rideRequestAction: RideRequestAction.CANCELED_BY_USER },
      { new: true, runValidators: true, session }
    );

    await User.findByIdAndUpdate(
      updatedRide?.rider,
      { isOnTrip: false },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction(); //transaction
    session.endSession();
    return { success: false, message: "Payment Failed" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const cancelPayment = async (query: Record<string, string>) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      {
        status: PAYMENT_STATUS.CANCELLED,
      },
      { session }
    );

    const updatedRide = await Ride.findByIdAndUpdate(
      updatedPayment?.ride,
      { rideRequestAction: RideRequestAction.CANCELED_BY_USER },
      { new: true, runValidators: true, session }
    );

    await User.findByIdAndUpdate(
      updatedRide?.rider,
      { isOnTrip: false },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction(); //transaction
    session.endSession();
    return { success: false, message: "Payment Cancelled" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const PaymentService = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
};
