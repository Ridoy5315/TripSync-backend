import httpStatus from "http-status-codes";
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RideService } from "./rides.service";
import { JwtPayload } from "jsonwebtoken";

const createRide = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const userId = req.params.userId;

  const createRequestRideInfo = await RideService.createRide(
    req.body,
    userId,
    decodedToken
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message:
      "Your ride request has been received. We're looking for available drivers. You'll be notified once a driver accepts your request.",
    data: createRequestRideInfo,
  });
});

const cancelRide = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const rideId = req.params.rideId;

  const createRequestRideInfo = await RideService.cancelRide(
    rideId,
    decodedToken
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Your ride request has been canceled",
    data: createRequestRideInfo,
  });
});

const riderFeedback = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const rideId = req.params.rideId;

  await RideService.riderFeedback(req.body, rideId, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "you has been given feedback to driver successfully",
    data: {},
  });
});

const rideDetails = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;

  const getRideDetails = await RideService.rideDetails(decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ride details Retrieved successfully",
    data: getRideDetails,
  });
});

const rideHistory = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const riderId = req.params.userId;
  const query = req.query;

  const ridesHistory = await RideService.rideHistory(
    riderId,
    query as Record<string, string>,
    decodedToken
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.ACCEPTED,
    message: "Rider get his ride history successfully",
    data: ridesHistory,
  });
});

const getAllRides = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const rides = await RideService.getAllRides(query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.ACCEPTED,
    message: "All Riders Retrieved Successfully",
    data: rides,
  });
});

const getAllRidesStats = catchAsync(async (req: Request, res: Response) => {

  const ridesStats = await RideService.getAllRidesStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Rider Stats Retrieved Successfully",
    data: ridesStats,
  });
});

export const RideController = {
  createRide,
  cancelRide,
  riderFeedback,
  rideDetails,
  rideHistory,
  getAllRides,
  getAllRidesStats
};
