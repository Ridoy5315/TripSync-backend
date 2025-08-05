/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Ride } from "./rides.model";
import {
  IRide,
  RideProgressStatus,
  RideRequestAction,
} from "./rides.interface";
import { distanceInKm } from "../../utils/findDistanceBetweenLocation";
import { rideFare } from "../../utils/fareForRide";
import { ApprovalStatus, DriverAvailability } from "../driver/driver.interface";
import { Driver } from "../driver/driver.model";

const createRide = async (
  payload: Partial<IRide>,
  userId: string,
  decodedToken: JwtPayload
) => {
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

  const distance = distanceInKm(payload);

  const originalFare = rideFare(distance);

  const rideInfo = {
    rider: isUserExist._id,
    pickupLocation: payload.pickupLocation,
    destinationLocation: payload.destinationLocation,
    distance: `${distance.toFixed(1)} km`,
    rideRequestAction: RideRequestAction.PENDING,
    rideRequestAt: new Date(),
    originalFare,
  };

  const createRequestRide = await Ride.create(rideInfo);

  const checkAvailableOnlineDriver = await Driver.find({availabilityStatus : "ONLINE"})
  if(!checkAvailableOnlineDriver || checkAvailableOnlineDriver.length === 0){
    return {
      message: "your request has been pending, but no drivers are available now"
    };
  }

  await User.findByIdAndUpdate(
    userId,
    { isOnTrip: true, $addToSet: { rides: createRequestRide._id } },
    { new: true, runValidators: true }
  );

  return createRequestRide;
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

const pendingRides = async (driverId: string, decodedToken: JwtPayload) => {
  if (decodedToken.role !== Role.DRIVER) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cant to check the pending rides"
    );
  }

  const isExistDriver = await Driver.findById(driverId);

  if (!isExistDriver) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver not found");
  }

  if (decodedToken.userId !== isExistDriver.driverInformation.toString()) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are not a valid driver");
  }

  const allPendingRides = await Ride.find({
    rideRequestAction: RideRequestAction.PENDING,
  });

  return allPendingRides;
};

const rejectRide = async (rideId: string, decodedToken: JwtPayload) => {
  const driver = await User.findById(decodedToken.userId);

  if (driver?.role !== Role.DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a driver");
  }

  const driverInfo = await User.aggregate([
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "driverInformation",
        as: "info",
      },
    },
    {
      $unwind: "$info",
    },
    { $match: { "info.driverInformation": driver?._id } },
  ]);

  const driverInformationId = driverInfo[0]?.info;

  if (driverInformationId?.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not authorized driver");
  }
  if (driverInformationId?.availabilityStatus !== DriverAvailability.ONLINE) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not in online");
  }

  const isRideExist = await Ride.findById(rideId);

  if (!isRideExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (isRideExist.rideRequestAction === RideRequestAction.CANCELED_BY_USER) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Rider already canceled this ride"
    );
  }

  const rejectRequestRide = await Ride.findByIdAndUpdate(
    rideId,
    {
      driver: driver._id,
      rideRequestAction: RideRequestAction.REJECTED_BY_DRIVER,
      rideRejectedAt: new Date(),
    },
    { new: true, runValidators: true }
  );

  const riderInformation = await Ride.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "rider",
        foreignField: "_id",
        as: "personalInfo",
      },
    },
    { $unwind: "$personalInfo" },
    { $match: { "personalInfo._id": isRideExist.rider } },
  ]);

  const riderPersonalInformation = riderInformation[0].personalInfo;

  await User.findByIdAndUpdate(
    riderPersonalInformation._id,
    { isOnTrip: false },
    { new: true, runValidators: true }
  );

  return rejectRequestRide;
};

const acceptRide = async (rideId: string, decodedToken: JwtPayload) => {
  const driver = await User.findById(decodedToken.userId);

  if (driver?.role !== Role.DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a driver");
  }

  const driverInfo = await User.aggregate([
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "driverInformation",
        as: "info",
      },
    },
    {
      $unwind: "$info",
    },
    { $match: { "info.driverInformation": driver?._id } },
  ]);

  const driverInformationId = driverInfo[0]?.info;

  if (driverInformationId?.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not authorized driver");
  }
  if (driverInformationId?.availabilityStatus !== DriverAvailability.ONLINE) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not in online");
  }

  const isRideExist = await Ride.findById(rideId);

  if (!isRideExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (isRideExist.rideRequestAction === RideRequestAction.CANCELED_BY_USER) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "rider already canceled this ride"
    );
  }

  if (isRideExist.rideRequestAction === RideRequestAction.REJECTED_BY_DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "you already reject this ride");
  }

  await Ride.findByIdAndUpdate(
    rideId,
    {
      driver: driver._id,
      rideRequestAction: RideRequestAction.ACCEPTED_BY_DRIVER,
      rideProgressStatus: RideProgressStatus.NOT_STARTED,
      rideAcceptedAt: new Date(),
    },
    { new: true, runValidators: true }
  );

  await Driver.findOneAndUpdate(
    { driverInformation: driver._id },
    { availabilityStatus: DriverAvailability.ON_TRIP },
    { new: true, runValidators: true }
  );

  return {};
};

const pickedUpRide = async (rideId: string, decodedToken: JwtPayload) => {
  const driver = await User.findById(decodedToken.userId);

  if (driver?.role !== Role.DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a driver");
  }

  const driverInfo = await User.aggregate([
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "driverInformation",
        as: "info",
      },
    },
    {
      $unwind: "$info",
    },
    { $match: { "info.driverInformation": driver?._id } },
  ]);

  const driverInformationId = driverInfo[0]?.info;

  if (driverInformationId?.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not authorized driver");
  }
  if (driverInformationId?.availabilityStatus !== DriverAvailability.ON_TRIP) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not in online");
  }

  const isRideExist = await Ride.findById(rideId);

  if (!isRideExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (isRideExist.rideProgressStatus !== RideProgressStatus.NOT_STARTED) {
    throw new AppError(httpStatus.NOT_FOUND, "please accept the ride first");
  }

  const pickedUpRide = await Ride.findByIdAndUpdate(
    rideId,
    {
      rideProgressStatus: RideProgressStatus.PICKED_UP,
      ridePickedUpAt: new Date(),
    },
    { new: true, runValidators: true }
  );

  return pickedUpRide;
};

const inTransitRide = async (rideId: string, decodedToken: JwtPayload) => {
  const driver = await User.findById(decodedToken.userId);

  if (driver?.role !== Role.DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a driver");
  }

  const driverInfo = await User.aggregate([
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "driverInformation",
        as: "info",
      },
    },
    {
      $unwind: "$info",
    },
    { $match: { "info.driverInformation": driver?._id } },
  ]);

  const driverInformationId = driverInfo[0]?.info;

  if (driverInformationId?.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not authorized driver");
  }
  if (driverInformationId?.availabilityStatus !== DriverAvailability.ON_TRIP) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not in online");
  }

  const isRideExist = await Ride.findById(rideId);

  if (!isRideExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (isRideExist.rideProgressStatus === RideProgressStatus.PICKED_UP) {
    const inTransitRide = await Ride.findByIdAndUpdate(
      rideId,
      {
        rideProgressStatus: RideProgressStatus.IN_TRANSIT,
      },
      { new: true, runValidators: true }
    );

    return inTransitRide;
  } else {
    throw new AppError(httpStatus.NOT_FOUND, "please pick up the rider first");
  }
};

const completedRide = async (rideId: string, decodedToken: JwtPayload) => {
  const driver = await User.findById(decodedToken.userId);

  if (driver?.role !== Role.DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a driver");
  }

  const driverInfo = await User.aggregate([
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "driverInformation",
        as: "info",
      },
    },
    {
      $unwind: "$info",
    },
    { $match: { "info.driverInformation": driver?._id } },
  ]);

  const driverInformationId = driverInfo[0]?.info;

  if (driverInformationId?.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not authorized driver");
  }
  if (driverInformationId?.availabilityStatus !== DriverAvailability.ON_TRIP) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not in online");
  }

  const isRideExist = await Ride.findById(rideId);

  if (!isRideExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  const riderInformation = await Ride.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "rider",
        foreignField: "_id",
        as: "personalInfo",
      },
    },
    { $unwind: "$personalInfo" },
    { $match: { "personalInfo._id": isRideExist.rider } },
  ]);

  const riderPersonalInformation = riderInformation[0].personalInfo;

  if (isRideExist.rideProgressStatus === RideProgressStatus.IN_TRANSIT) {
    const completedRide = await Ride.findByIdAndUpdate(
      rideId,
      {
        rideProgressStatus: RideProgressStatus.COMPLETED,
        rideCompletedAt: new Date(),
        driverEarning: (Number(isRideExist.originalFare) * 0.8).toFixed(2),
        companyEarning: (Number(isRideExist.originalFare) * (1 - 0.8)).toFixed(
          2
        ),
        riderFeedback: "",
        driverRating: null,
      },
      { new: true, runValidators: true }
    );

    const driverTotalIncome =
      Number(driverInformationId.totalIncome) +
      Number(completedRide?.driverEarning);

    const updateDriverInfo = await Driver.findByIdAndUpdate(
      driverInformationId._id,
      {
        availabilityStatus: DriverAvailability.ONLINE,
        totalIncome: driverTotalIncome.toFixed(2),
      },
      { new: true, runValidators: true }
    );

    const updatedRiderPersonalInfo = await User.findByIdAndUpdate(
      riderPersonalInformation._id,
      { isOnTrip: false },
      { new: true, runValidators: true }
    );

    return {
      completedRide,
      updateDriverInfo,
      updatedRiderPersonalInfo,
    };
  } else {
    throw new AppError(httpStatus.NOT_FOUND, "please pick up the rider first");
  }
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

const rideHistory = async (riderId: string, decodedToken: JwtPayload) => {
  const rider = await User.findById(riderId);

  if (!rider) {
    throw new AppError(httpStatus.NOT_FOUND, "Rider not found");
  }

  if (riderId !== decodedToken.userId) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not authorize rider");
  }

  const completedRides = await User.findById(riderId).populate({
    path: "rides",
    match: { rideProgressStatus: "COMPLETED" },
    select:
      "pickupLocation destinationLocation rideRequestAt rideAcceptedAt ridePickedUpAt rideCompletedAt originalFare driverRating riderFeedback",
  });

  const ridesHistory = {
    name: rider.name,
    email: rider.email,
    rides: completedRides?.rides,
  };

  return ridesHistory;
};

const getAllRides = async () => {
  const allRides = await Ride.find()
    .populate({
      path: "rider",
      select: "name email phone address picture gender",
      model: "User",
    })
    .populate({
      path: "driver",
      select: "name email phone address picture gender",
      model: "User",
    })
    .lean();

  const rides = allRides.map((ride) => ({
    pickupLocation: ride.pickupLocation,
    destinationLocation: ride.destinationLocation,
    rideProgressStatus: ride.rideProgressStatus,
    fare: ride.originalFare,
    rider: {
      name: (ride.rider as any)?.name,
      email: (ride.rider as any)?.email,
      phone: (ride.rider as any)?.phone,
      address: (ride.rider as any)?.address,
      picture: (ride.rider as any)?.picture,
      gender: (ride.rider as any)?.gender,
    },
    driver: {
      name: (ride.driver as any)?.name,
      email: (ride.driver as any)?.email,
      phone: (ride.driver as any)?.phone,
      address: (ride.driver as any)?.address,
      picture: (ride.driver as any)?.picture,
      gender: (ride.driver as any)?.gender,
    },
  }));

  return rides;
};

export const RideService = {
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
  getAllRides,
};
