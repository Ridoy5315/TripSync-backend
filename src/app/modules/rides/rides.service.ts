/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Ride } from "./rides.model";
import { IRide, RideRequestAction } from "./rides.interface";
import { Driver } from "../driver/driver.model";
import { Payment } from "../payment/payment.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { SSLService } from "../sslCommerz/sslCommerze.service";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { Types } from "mongoose";
import { QueryBuilder } from "../../utils/queryBuilder";

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

const createRide = async (
  payload: Partial<IRide>,
  userId: string,
  decodedToken: JwtPayload
) => {
  const session = await Ride.startSession();
  session.startTransaction();

  try {
    if (
      decodedToken.role === Role.USER ||
      decodedToken.role === Role.ADMIN ||
      decodedToken.role === Role.SUPER_ADMIN ||
      decodedToken.role === Role.DRIVER
    ) {
      if (userId !== decodedToken.userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
      }
    }

    const isUserExist = await User.findById(userId);

    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    //check if user fulfill his account or not
    if (
      !isUserExist.phone ||
      !isUserExist.picture ||
      !isUserExist.address ||
      !isUserExist.dateOfBirth ||
      !isUserExist.gender
    ) {
      throw new AppError(
        httpStatus.EXPECTATION_FAILED,
        "Please fulfill your profile first"
      );
    }

    if (isUserExist.isOnTrip) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "You are already on a trip. Please complete it before requesting another."
      );
    }

    const checkAvailableOnlineDriver = await Driver.find({
      availabilityStatus: "ONLINE",
    });

    if (!checkAvailableOnlineDriver) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "your request has been pending, but no drivers are available now"
      );
    }

    const rideInfo = {
      rider: isUserExist._id,
      pickupLocation: payload.pickupLocation,
      destinationLocation: payload.destinationLocation,
      distance: `${payload.distance} km`,
      rideRequestAction: RideRequestAction.PENDING,
      rideRequestAt: new Date(),
      originalFare: payload.originalFare,
    };

    const createRequestRide = await Ride.create([rideInfo], { session });

    //payment
    const transactionId = getTransactionId();

    const payment = await Payment.create(
      [
        {
          ride: createRequestRide[0]._id,
          transactionId: transactionId,
          paymentMethod: payload.paymentMethod,
          status: PAYMENT_STATUS.UNPAID,
          amount: Number(payload.originalFare),
        },
      ],
      { session }
    );

    await User.findByIdAndUpdate(
      userId,
      { isOnTrip: true, $addToSet: { rides: createRequestRide[0]._id } },
      { new: true, runValidators: true, session }
    );

    const updatedRide = await Ride.findByIdAndUpdate(
      createRequestRide[0]._id,
      { payment: payment[0]._id },
      { new: true, runValidators: true, session }
    )
      .populate("rider", "name email phone address")
      .populate("payment");

    // SSLCOMMERZ payment process
    const rideId = createRequestRide[0]._id;
    const riderAddress = (updatedRide?.rider as any).address;
    const riderEmail = (updatedRide?.rider as any).email;
    const riderPhoneNumber = (updatedRide?.rider as any).phone;
    const riderName = (updatedRide?.rider as any).name;

    const sslPayload: ISSLCommerz = {
      rideId,
      address: riderAddress,
      email: riderEmail,
      phoneNumber: riderPhoneNumber,
      name: riderName,
      amount: Number(payload.originalFare),
      transactionId: transactionId,
    };

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    await session.commitTransaction();
    session.endSession();

    return {
      paymentUrl: sslPayment.GatewayPageURL,
      ride: updatedRide,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const cancelRide = async (rideId: string, decodedToken: JwtPayload) => {
  const isRideExist = await Ride.findById(rideId);
  if (!isRideExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  const fullRideInfo = await Ride.aggregate([
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
    { $match: { "userInfo._id": isRideExist?.rider } },
  ]);

  const userId = fullRideInfo[0].userInfo._id.toString();

  if (
    decodedToken.role === Role.USER ||
    decodedToken.role === Role.ADMIN ||
    decodedToken.role === Role.SUPER_ADMIN ||
    decodedToken.role === Role.DRIVER
  ) {
    if (userId !== decodedToken.userId) {
      throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
    }
  }

  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isRideExist.rideRequestAction != RideRequestAction.PENDING) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "You can't cancel this ride in this moment"
    );
  }

  //check cancellation limit exceeded or not for this limit
  const now = new Date();

  if (
    !isUserExist.cancellationResetDate ||
    isUserExist.cancellationResetDate.getMonth() !== now.getMonth() ||
    isUserExist.cancellationResetDate.getFullYear() !== now.getFullYear()
  ) {
    isUserExist.monthlyCancelLimit = 5;
    isUserExist.cancellationResetDate = now;
  }

  if ((isUserExist.monthlyCancelLimit as number) <= 0) {
    throw new Error("Cancellation limit exceeded for this month");
  }

  (isUserExist.monthlyCancelLimit as number) -= 1;
  await isUserExist.save();

  const createRequestRide = await Ride.findByIdAndUpdate(
    rideId,
    {
      rideRequestAction: RideRequestAction.CANCELED_BY_USER,
      rideCanceledAt: new Date(),
    },
    { new: true, runValidators: true }
  );

  await User.findByIdAndUpdate(
    userId,
    { isOnTrip: false },
    { new: true, runValidators: true }
  );

  return createRequestRide;
};

const riderFeedback = async (
  payload: Partial<IRide>,
  rideId: string,
  decodedToken: JwtPayload
) => {
  const riderId = decodedToken.userId;

  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (riderId !== ride.rider.toString()) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are not correct rider");
  }

  await Ride.findByIdAndUpdate(
    rideId,
    {
      driverRating: payload.driverRating
        ? payload.driverRating
        : ride.driverRating,
      riderFeedback: payload.riderFeedback
        ? payload.riderFeedback
        : ride.riderFeedback,
    },
    { new: true, runValidators: true }
  );

  const ratingAggregation = await Ride.aggregate([
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

  await Driver.findOneAndUpdate(
    { driverInformation: ride.driver },
    { rating: ratingAggregation[0].averageRating.toFixed(1) },
    { new: true, runValidators: true }
  );
};

const rideDetails = async (decodedToken: JwtPayload) => {
  const riderId = decodedToken.userId;

  const rider = await User.findById(riderId);

  const lastRideId = rider?.rides?.[rider.rides.length - 1];

  const ride = await Ride.findById(lastRideId);

  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (["ACCEPTED", "REJECTED"].includes(ride.rideRequestAction)) {
    // Run aggregation with lookups
    const rideDetails = await Ride.aggregate([
      {
        $match: { _id: new Types.ObjectId(lastRideId) },
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
  } else {
    // Return only ride info without lookups
    return {
      rideDetails: ride,
    };
  }
};

const rideHistory = async (
  riderId: string,
  query: Record<string, string>,
  decodedToken: JwtPayload
) => {
  const rider = await User.findById(riderId);

  if (!rider) {
    throw new AppError(httpStatus.NOT_FOUND, "Rider not found");
  }

  if (riderId !== decodedToken.userId) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not authorize rider");
  }

  const user = await User.findById(riderId).select("rides").lean();
  const rideIds = user?.rides || [];

  const queryBuilder = new QueryBuilder(
    Ride.find({ _id: { $in: rideIds } }).select(
      "pickupLocation destinationLocation distance rideRequestAction rideRequestAt originalFare rideProgressStatus"
    ),
    query
  );

  const rides = await queryBuilder.filter().sort().fields().paginate();

  const [data, meta] = await Promise.all([
    rides.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getAllRides = async (query: Record<string, string>) => {
  let ridesQuery = Ride.find().select(
    "pickupLocation destinationLocation distance rideRequestAction rideRequestAt originalFare"
  );

  if (query.riderGender) {
    ridesQuery = ridesQuery.where("rider.gender").equals(query.riderGender);
  }

  const queryBuilder = new QueryBuilder(ridesQuery, query);

  const ridesData = queryBuilder.filter().sort().fields().paginate();

  const [data, meta] = await Promise.all([
    ridesData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getAllRidesStats = async () => {
  const totalRidesPromise = Ride.countDocuments();
  const totalCompleteRidesPromise = Ride.countDocuments({
    rideProgressStatus: "COMPLETED",
  });

  const ridesInLast7DaysPromise = Ride.countDocuments({
    createdAt: { $gte: dateSevenDaysAgo },
  });
  const ridesInLast30DaysPromise = Ride.countDocuments({
    createdAt: { $gte: dateThirtyDaysAgo },
  });

  const [totalRides, totalCompleteRides, ridesInLast7Days, ridesInLast30Days] =
    await Promise.all([
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
};

export const RideService = {
  createRide,
  cancelRide,
  riderFeedback,
  rideDetails,
  rideHistory,
  getAllRides,
  getAllRidesStats,
};
