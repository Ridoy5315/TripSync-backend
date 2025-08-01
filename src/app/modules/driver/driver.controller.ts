import httpStatus from "http-status-codes";
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DriverServices } from "./driver.service";
import { JwtPayload } from "jsonwebtoken";
import { sendResponse } from "../../utils/sendResponse";

const createDriver = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const userId = req.params.id;

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
    const userId = req.params.id;

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

export const DriverControllers = {
  createDriver,
  approveOrRejectDriver,
};
