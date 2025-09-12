/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import {
  ApprovalStatus,
  DriverAvailability,
  IVehicleInfo,
} from "./driver.interface";
import { JwtPayload } from "jsonwebtoken";
import { IsActive, Role } from "../user/user.interface";
import { Driver, VehicleInfo } from "./driver.model";
import { sendEmail } from "../../utils/sendEmail";
import { Ride } from "../rides/rides.model";
import {
  RideProgressStatus,
  RideRequestAction,
} from "../rides/rides.interface";
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

const createDriver = async (
  payload: Partial<IVehicleInfo>,
  userId: string,
  decodedToken: JwtPayload
) => {
  if (decodedToken.role === Role.USER || decodedToken.role === Role.DRIVER) {
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

  //check user's birth date under 21 or not
  if (isUserExist.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(isUserExist.dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();

    const hasHadBirthdayThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    const actualAge = hasHadBirthdayThisYear ? age : age - 1;

    if (actualAge < 21) {
      throw new AppError(
        httpStatus.EXPECTATION_FAILED,
        "You must be at least 21 years old to apply as a driver."
      );
    }
  }

  if (isUserExist.role === Role.DRIVER) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "You already a driver in this platform"
    );
  }

  const driver = await Driver.create({
    driverInformation: isUserExist._id,
    approvalStatus: ApprovalStatus.PENDING,
  });

  const vehicleInfo = await VehicleInfo.create({
    owner: driver._id,
    brand: payload.brand,
    model: payload.model,
    licensePlate: payload.licensePlate,
    color: payload.color,
    manufacturingYear: payload.manufacturingYear,
  });

  driver.vehicleInfo = vehicleInfo._id;
  await driver.save();

  return {
    driver,
    vehicleInfo,
  };
};

const getPendingDrivers = async () => {
  const pendingDrivers = await Driver.find({
    approvalStatus: "PENDING",
  })
    .populate({
      path: "driverInformation",
      select: "name email phone picture address gender dateOfBirth",
    })
    .populate({
      path: "vehicleInfo",
      select: "brand model licensePlate color manufacturingYear",
    });

  return pendingDrivers;
};

const approveOrRejectDriver = async (status: string, userId: string) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (
    isUserExist.isActive === IsActive.BLOCKED ||
    isUserExist.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User is ${isUserExist.isActive}`
    );
  }
  if (isUserExist.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (!isUserExist.isVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Your account is is not verified"
    );
  }

  const driverInformation = await User.aggregate([
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
    { $match: { "info.driverInformation": isUserExist._id } },
  ]);

  const driverInfo = driverInformation[0].info;

  if (driverInfo.approvalStatus !== "PENDING") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User haven't apply for a driver in this platform"
    );
  }

  if (status === "REJECTED") {
    await Driver.findByIdAndUpdate(
      driverInfo._id,
      {
        approvalStatus: ApprovalStatus.REJECTED,
      },
      { new: true, runValidators: true }
    );

    return null;
  } else if (status === "APPROVED") {
    const [updatedDriverAfterApproved, updatedUserAfterApproved] =
      await Promise.all([
        Driver.findByIdAndUpdate(
          driverInfo._id,
          {
            approvalStatus: ApprovalStatus.APPROVED,
            availabilityStatus: DriverAvailability.OFFLINE,
            location: {
              type: "Point",
              coordinates: [121.4737, 31.2304], //Shanghai
            },
            rating: 0,
            totalIncome: 0,
          },
          { new: true, runValidators: true }
        ),
        User.findByIdAndUpdate(
          isUserExist._id,
          { role: Role.DRIVER },
          { new: true, runValidators: true }
        ),
      ]);

    sendEmail({
      to: isUserExist.email,
      subject: "Your Driver Application Has Been Approved!",
      templateName: "approve-driver-email",
      templateData: {
        name: isUserExist.name,
      },
    });

    return {
      updatedDriverAfterApproved,
      updatedUserAfterApproved,
    };
  }
};

const getAvailabilityStatus = async (decodedToken: JwtPayload) => {
  const isUserExist = await User.findById(decodedToken.userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isUserExist.role !== Role.DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a driver");
  }

  const driver = await Driver.findOne({ driverInformation: isUserExist._id });

  if (!driver) throw new Error("Driver not found");

  return driver;
};

const availabilityStatus = async (decodedToken: JwtPayload) => {
  // if (decodedToken.role === Role.USER || decodedToken.role === Role.DRIVER) {
  //   if (userId !== decodedToken.userId) {
  //     throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
  //   }
  // }

  const isUserExist = await User.findById(decodedToken.userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isUserExist.role !== Role.DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a driver");
  }

  const driver = await Driver.findOne({ driverInformation: isUserExist._id });

  if (!driver) throw new Error("Driver not found");

  driver.availabilityStatus =
    driver.availabilityStatus === DriverAvailability.ONLINE
      ? DriverAvailability.OFFLINE
      : DriverAvailability.ONLINE;

  const updatedDriver = await driver.save();

  return updatedDriver;
};

const pendingRides = async (
  query: Record<string, string>,
  decodedToken: JwtPayload
) => {
  if (decodedToken.role !== Role.DRIVER) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cant to check the pending rides"
    );
  }

  const page = Number(query.page);
  const limit = 10;
  const skip = (page - 1) * limit;

  const allPendingRides = await Ride.find({
    rideRequestAction: RideRequestAction.PENDING,
  })
    .skip(skip)
    .limit(limit);

  const total = await Ride.countDocuments({
    rideRequestAction: RideRequestAction.PENDING,
  });

  return {
    allPendingRides,
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
  };
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
  if (driverInformationId?.availabilityStatus === DriverAvailability.OFFLINE) {
    throw new AppError(httpStatus.NOT_FOUND, "You are in offline");
  }
  if (driverInformationId?.availabilityStatus === DriverAvailability.ON_TRIP) {
    throw new AppError(httpStatus.NOT_FOUND, "You are in a trip");
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

  await Ride.findByIdAndUpdate(
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

  return {};
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
  if (driverInformationId?.availabilityStatus === DriverAvailability.OFFLINE) {
    throw new AppError(httpStatus.NOT_FOUND, "You are in offline");
  }
  if (driverInformationId?.availabilityStatus === DriverAvailability.ON_TRIP) {
    throw new AppError(httpStatus.NOT_FOUND, "You are in a trip");
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

  const ride = await Ride.findByIdAndUpdate(
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

  return ride;
};

const getActiveRideStatus = async (decodedToken: JwtPayload) => {
  const isUserExist = await User.findById(decodedToken.userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isUserExist.role !== Role.DRIVER) {
    throw new AppError(httpStatus.NOT_FOUND, "You are not a driver");
  }

  const activeRide = await Ride.findOne({
    driver: isUserExist._id,
    rideRequestAction: "ACCEPTED",
    rideProgressStatus: { $ne: "COMPLETED" },
  }).sort({ createdAt: 1 });

  return activeRide;
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

const getAllDrivers = async () => {
  const allDrivers = await Driver.find({ approvalStatus: "APPROVED" })
    .populate({
      path: "driverInformation",
      select: "name email phone address picture gender dateOfBirth",
      model: "User",
    })
    .populate({
      path: "vehicleInfo",
      select: "brand model licensePlate color manufacturingYear",
      model: "VehicleInfo",
    })
    .lean();

  const drivers = allDrivers.map((driver) => ({
    name: (driver.driverInformation as any)?.name,
    email: (driver.driverInformation as any)?.email,
    phone: (driver.driverInformation as any)?.phone,
    address: (driver.driverInformation as any)?.address,
    dateOfBirth: (driver.driverInformation as any)?.dateOfBirth,
    picture: (driver.driverInformation as any)?.picture,
    gender: (driver.driverInformation as any)?.gender,
    approvalStatus: driver.approvalStatus,
    rating: driver.rating,
    totalIncome: driver.totalIncome,
    vehicleInfo: {
      brand: (driver.vehicleInfo as any)?.brand,
      model: (driver.vehicleInfo as any)?.model,
      licensePlate: (driver.vehicleInfo as any)?.licensePlate,
      color: (driver.vehicleInfo as any)?.color,
      manufacturingYear: (driver.vehicleInfo as any)?.manufacturingYear,
    },
  }));

  // const totalDrivers = await Driver.countDocuments();
  // const page = Number(this.query.page) || 1;
  // const limit = Number(this.query.limit) || 10;
  // const totalPage = Math.ceil(totalDocuments/limit)

  // return {total: totalDocuments, page, limit, totalPage}

  return {
    data: drivers,
  };
};

const driverEarningHistory = async (driverId: string) => {
  const earningHistory = await Ride.aggregate([
    {
      $match: {
        driver: new Types.ObjectId(driverId),
        rideProgressStatus: "COMPLETED",
      },
    },
    {
      $project: {
        rider: 1,
        pickupLocation: 1,
        destinationLocation: 1,
        distance: 1,
        rideProgressStatus: 1,
        driverRating: 1,
        riderFeedback: 1,
        earn: { $toDouble: "$driverEarning" },
        createdAt: 1,
        rideCompletedAt: 1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "rider",
        foreignField: "_id",
        as: "riderInfo",
      },
    },
    {
      $unwind: "$riderInfo",
    },
    {
      $project: {
        rider: {
          name: "$riderInfo.name",
          gender: "$riderInfo.gender",
        },
        pickupLocation: 1,
        destinationLocation: 1,
        distance: 1,
        rideProgressStatus: 1,
        driverRating: 1,
        riderFeedback: 1,
        earn: 1,
        createdAt: 1,
        rideCompletedAt: 1,
      },
    },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalEarn: { $sum: "$earn" },
              totalRides: { $sum: 1 },
              rides: { $push: "$$ROOT" },
            },
          },
          {
            $project: {
              _id: 0,
              totalEarn: 1,
              totalRides: 1,
              rides: 1,
            },
          },
        ],
        today: [
          {
            $match: {
              rideCompletedAt: { $gte: startOfToday, $lte: endOfToday },
            },
          },
          {
            $group: {
              _id: null,
              totalEarn: { $sum: "$earn" },
              totalRides: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              totalEarn: 1,
              totalRides: 1,
            },
          },
        ],
        last7days: [
          {
            $match: {
              rideCompletedAt: { $gte: dateSevenDaysAgo, $lte: now },
            },
          },
          {
            $group: {
              _id: null,
              totalEarn: { $sum: "$earn" },
              totalRides: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              totalEarn: 1,
              totalRides: 1,
            },
          },
        ],
        last30days: [
          {
            $match: {
              rideCompletedAt: { $gte: dateThirtyDaysAgo, $lte: now },
            },
          },
          {
            $group: {
              _id: null,
              totalEarn: { $sum: "$earn" },
              totalRides: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              totalEarn: 1,
              totalRides: 1,
            },
          },
        ],
      },
    },
  ]);

  return earningHistory;
};

const singleDriverStat = async (driverId: string) => {
  const driver = await Driver.findById(driverId);

  const driverStat = await Driver.aggregate([
    {
      $match: { _id: driver?._id },
    },
    {
      $lookup: {
        from: "users",
        localField: "driverInformation",
        foreignField: "_id",
        as: "info",
      },
    },
    {
      $unwind: "$info",
    },
    {
      $lookup: {
        from: "rides",
        localField: "driverInformation",
        foreignField: "driver",
        as: "driverRidesInfo",
      },
    },
    {
      $project: {
        name: "$info.name",
        email: "$info.email",
        _id: 0,
        totalEarn: "$totalIncome",
        rating: 1,
        completedRides: {
          $size: {
            $filter: {
              input: "$driverRidesInfo",
              as: "ride",
              cond: { $eq: ["$$ride.rideProgressStatus", "COMPLETED"] },
            },
          },
        },
      },
    },
  ]);

  return driverStat;
};

const completedRides = async (
  query: Record<string, string>,
  decodedToken: JwtPayload
) => {
  if (decodedToken.role !== Role.DRIVER) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized driver");
  }

  const userId = decodedToken.userId;

  const isDriverExist = await Driver.findOne({ driverInformation: userId });
  if (!isDriverExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "driver not found");
  }

  const queryBuilder = new QueryBuilder(
    Ride.find({ driver: userId, rideProgressStatus: "COMPLETED" }).select(
      "destinationLocation distance pickupLocation originalFare"
    ),
    query
  );

  const completedRides = await queryBuilder.filter().sort().fields().paginate();

  const [data, meta] = await Promise.all([
    completedRides.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

export const DriverServices = {
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
