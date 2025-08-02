import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Ride } from "./rides.model";
import { IRide, RideRequestAction } from "./rides.interface";
import { distanceInKm } from "../../utils/findDistanceBetweenLocation";
import { rideFare } from "../../utils/fareForRide";
import { Driver } from "../driver/driver.model";
import { ApprovalStatus, DriverAvailability } from "../driver/driver.interface";
import { Types } from "mongoose";

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

  const distance = distanceInKm(payload);

  const fare = rideFare(distance);

  console.log(distanceInKm, fare);

  const rideInfo = {
    user: isUserExist._id,
    pickupLocation: payload.pickupLocation,
    destinationLocation: payload.destinationLocation,
    distance: `${distance.toFixed(1)} km`,
    rideRequestAction: RideRequestAction.ONGOING,
    fare,
  };

  const createRequestRide = await Ride.create(rideInfo);

  return createRequestRide;
};

const cancelRide = async (
  rideId: string,
  decodedToken: JwtPayload
) => {
  const isRideExist = await Ride.findById(rideId);
  if (!isRideExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  const fullRideInfo  = await Ride.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userInfo"
      },
    },
    {
      $unwind: "$userInfo"
    },
    { $match: { "userInfo._id": isRideExist?.user } },
  ])

  const userId = (fullRideInfo[0].userInfo._id).toString()

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

  if(isRideExist.rideRequestAction != RideRequestAction.ONGOING){
    throw new AppError(httpStatus.NOT_FOUND, "You can't cancel this ride in this moment");
  }

  const createRequestRide = await Ride.findByIdAndUpdate(
    rideId,
    {
      rideRequestAction: RideRequestAction.CANCELED_BY_USER,
    },
    { new: true, runValidators: true }
  );

  return createRequestRide;
};

const rejectRide = async (
  rideId: string,
  decodedToken: JwtPayload
) => {

  const driver = await User.findById(decodedToken.userId)

  if(driver?.role !== Role.DRIVER){
    throw new AppError(httpStatus.NOT_FOUND, "Ypu are not a driver");
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

  const driverInformationId = driverInfo[0]?.info

  if(driverInformationId?.approvalStatus !== ApprovalStatus.APPROVED){
    throw new AppError(httpStatus.NOT_FOUND, "You are not authorized driver");
  }
  if(driverInformationId?.availabilityStatus !== DriverAvailability.ONLINE){
    throw new AppError(httpStatus.NOT_FOUND, "You are not in online");
  }

  const isRideExist = await Ride.findById(rideId);

  if (!isRideExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if(isRideExist.rideRequestAction === RideRequestAction.CANCELED_BY_USER ){
    throw new AppError(httpStatus.NOT_FOUND, "You can't Accept this ride in this moment");
  }

  const rejectRequestRide = await Ride.findByIdAndUpdate(
    rideId,
    {
      rideRequestAction: RideRequestAction.REJECTED_BY_DRIVER,
    },
    { new: true, runValidators: true }
  );

  return rejectRequestRide;
};

export const RideService = {
  createRide,
  cancelRide,
  rejectRide
};
