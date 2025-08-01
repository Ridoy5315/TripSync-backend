import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { ApprovalStatus, IVehicleInfo } from "./driver.interface";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
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

export const DriverServices = {
  createDriver,
};
