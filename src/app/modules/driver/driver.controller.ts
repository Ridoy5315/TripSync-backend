import httpStatus from "http-status-codes";
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DriverServices } from "./driver.service";
import { JwtPayload } from "jsonwebtoken";
import { sendResponse } from "../../utils/sendResponse";

const createDriver = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const userId = req.params.userId;

  const vehicleInfo = await DriverServices.createDriver(
    req.body,
    userId,
    decodedToken as JwtPayload
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User applied for be a driver Successfully",
    data: vehicleInfo,
  });
});

const approveOrRejectDriver = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;

    const { approvalStatus } = req.body;

    if (approvalStatus === "REJECTED") {
       await DriverServices.approveOrRejectDriver(
        approvalStatus,
        userId
      );
      sendResponse(res, {
        success: false,
        statusCode: httpStatus.EXPECTATION_FAILED,
        message:
          "Your driver application has been reviewed and unfortunately, it has been rejected.",
        data: {},
      });
    } else if (approvalStatus === "APPROVED") {
      const driverInformation = await DriverServices.approveOrRejectDriver(
        approvalStatus,
        userId
      );

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "You can now start accepting ride requests. Make sure to stay available and keep your profile up to date.",
        data: driverInformation,
      });
    }
  }
);

const getAllDrivers = catchAsync(
  async (req: Request, res: Response) => {

  const result = await DriverServices.getAllDrivers();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Drivers Retrieved Successfully",
    data: result.data
  });
  }
);

const driverEarningHistory = catchAsync(async (req: Request, res: Response) => {
     const driverId = req.params.driverId

     const earningHistory = await DriverServices.driverEarningHistory(driverId)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Driver earning history",
    data: earningHistory,
  });
});

const singleDriverStat = catchAsync(async (req: Request, res: Response) => {

     const driverId = req.params.driverId

     const driverStat = await DriverServices.singleDriverStat(driverId)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Single Driver State",
    data: driverStat,
  });
});

const completedRides = catchAsync(async (req: Request, res: Response) => {

     const driverId = req.params.driverId
     const decodedToken = req.user;

     const driverStat = await DriverServices.completedRides(driverId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Single Driver State",
    data: driverStat,
  });
});

export const DriverControllers = {
  createDriver,
  approveOrRejectDriver,
  getAllDrivers,
  driverEarningHistory,
  singleDriverStat,
  completedRides
};
