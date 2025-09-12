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

const getPendingDrivers = catchAsync(
  async (req: Request, res: Response) => {

      const pendingDrivers = await DriverServices.getPendingDrivers();

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Pending drivers has been Retrieved successfully.",
        data: pendingDrivers,
      });
  }
);

const approveOrRejectDriver = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;

    const { status } = JSON.parse(req.body.data);

    if (status === "REJECTED") {
      await DriverServices.approveOrRejectDriver(status, userId);
      sendResponse(res, {
        success: false,
        statusCode: httpStatus.EXPECTATION_FAILED,
        message:
          "Driver application rejected successfully.",
        data: {},
      });
    } else if (status === "APPROVED") {
      const driverInformation = await DriverServices.approveOrRejectDriver(
        status,
        userId
      );

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message:
          "Driver application accepted successfully.",
        data: driverInformation,
      });
    }
  }
);

const getAvailabilityStatus = catchAsync(
  async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;

    const driver = await DriverServices.getAvailabilityStatus(
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Driver availability status has been Retrieved successfully.",
      data: driver,
    });
  }
);

const availabilityStatus = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;

  const status = await DriverServices.availabilityStatus(
    decodedToken as JwtPayload
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Driver availability status has been changed.",
    data: status,
  });
});

const pendingRides = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const decodedToken = req.user as JwtPayload;

  const pendingRidesInfo = await DriverServices.pendingRides(
    query as Record<string, string>,
    decodedToken
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All pending rides retrieved successfully",
    data: pendingRidesInfo,
  });
});

const rejectRide = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const rideId = req.params.rideId;

  await DriverServices.rejectRide(
    rideId,
    decodedToken
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "driver rejected this ride",
    data: {},
  });
});

const acceptRide = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const rideId = req.params.rideId;

  const ride = await DriverServices.acceptRide(rideId, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "driver accepted this ride",
    data: ride,
  });
});

const getActiveRideStatus = catchAsync(
  async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;

    const ride = await DriverServices.getActiveRideStatus(
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Active ride has been Retrieved successfully.",
      data: ride,
    });
  }
);

const pickedUpRide = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const rideId = req.params.rideId;

  const pickedUpRiderInfo = await DriverServices.pickedUpRide(
    rideId,
    decodedToken
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "driver picked up this rider",
    data: pickedUpRiderInfo,
  });
});

const inTransitRide = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const rideId = req.params.rideId;

  const inTransitInfo = await DriverServices.inTransitRide(rideId, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "driver in-transit",
    data: inTransitInfo,
  });
});

const completedRide = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const rideId = req.params.rideId;

  const afterCompleted = await DriverServices.completedRide(rideId, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "rides completed",
    data: afterCompleted,
  });
});

const getAllDrivers = catchAsync(async (req: Request, res: Response) => {
  const result = await DriverServices.getAllDrivers();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Drivers Retrieved Successfully",
    data: result.data,
  });
});

const driverEarningHistory = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.params.driverId;

  const earningHistory = await DriverServices.driverEarningHistory(driverId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Driver earning history",
    data: earningHistory,
  });
});

const singleDriverStat = catchAsync(async (req: Request, res: Response) => {
  const driverId = req.params.driverId;

  const driverStat = await DriverServices.singleDriverStat(driverId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Single Driver State",
    data: driverStat,
  });
});

const completedRides = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user;
  const query = req.query;

  const driverStat = await DriverServices.completedRides(
    query as Record<string, string>,
    decodedToken as JwtPayload
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Driver get his completed rides history successfully",
    data: driverStat,
  });
});

export const DriverControllers = {
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
