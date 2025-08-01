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

const createDriver = async (
  payload: Partial<IVehicleInfo>,
  userId: string,
  decodedToken: JwtPayload
) => {
  if (
    decodedToken.role === Role.USER ||
    decodedToken.role === Role.DRIVER ||
    decodedToken.role === Role.RIDER
  ) {
    if (userId !== decodedToken.userId) {
      throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
    }
  }

  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
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

  if(approvalStatus === "REJECTED") {

    await Driver.findByIdAndUpdate(
        driverInfo._id,
        {
          approvalStatus: ApprovalStatus.REJECTED
        },
        { new: true, runValidators: true }
      )

      return null
  }

  else if (approvalStatus === "APPROVED") {
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
          totalIncome: "0$",
        },
        { new: true, runValidators: true }
      ),
      User.findByIdAndUpdate(
        isUserExist._id,
        { role: Role.DRIVER },
        { new: true, runValidators: true }
      ),
    ]);

  return {
    updatedDriverAfterApproved,
    updatedUserAfterApproved,
  };
  }
};

export const DriverServices = {
  createDriver,
  approveOrRejectDriver,
};
