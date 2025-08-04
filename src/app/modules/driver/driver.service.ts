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

const approveOrRejectDriver = async (
  approvalStatus: string,
  userId: string
) => {
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
      "You haven't apply for a driver in this platform"
    );
  }

  if (approvalStatus === "REJECTED") {
    await Driver.findByIdAndUpdate(
      driverInfo._id,
      {
        approvalStatus: ApprovalStatus.REJECTED,
      },
      { new: true, runValidators: true }
    );

    return null;
  } else if (approvalStatus === "APPROVED") {
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

const getAllDrivers = async () => {
  // const queryBuilder = new QueryBuilder(User.find(), query);

  //   const usersData = queryBuilder
  //     .filter()
  //     .search(userSearchableFields)
  //     .sort()
  //     .fields()
  //     .paginate();

  //   const [data, meta] = await Promise.all([
  //     usersData.build(),
  //     queryBuilder.getMeta(),
  //   ]);
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
    data: drivers
  };
};

const driverEarningHistory = async (driverId: string) => {
  const driverInfo = await Driver.findById(driverId);

  const earningHistory = await Ride.aggregate([
    {
      $match: {
        driver: driverInfo?.driverInformation,
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
        driverEarning: 1,
        createdAt: 1,
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
        earn: { $toDouble: "$driverEarning" },
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: null,
        totalEarn: { $sum: "$earn" },
        rides: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: 0,
        totalEarn: 1,
        rides: 1,
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

export const DriverServices = {
  createDriver,
  approveOrRejectDriver,
  getAllDrivers,
  driverEarningHistory,
  singleDriverStat,
};
