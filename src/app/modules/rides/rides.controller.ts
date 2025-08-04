import httpStatus from 'http-status-codes';
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RideService } from "./rides.service";
import { JwtPayload } from "jsonwebtoken";


const createRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const userId = req.params.userId;

     const createRequestRideInfo = await RideService.createRide(req.body, userId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Your ride request has been received. We're looking for available drivers. You'll be notified once a driver accepts your request.",
    data: createRequestRideInfo,
  });
});

const cancelRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.rideId

     const createRequestRideInfo = await RideService.cancelRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Your ride request has been canceled",
    data: createRequestRideInfo,
  });
});

const pendingRides = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const driverId = req.params.driverId;

     const pendingRidesInfo = await RideService.pendingRides(driverId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All pending rides retrieved successfully",
    data: pendingRidesInfo,
  });
});

const rejectRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.rideId

     const rejectRequestRideInfo = await RideService.rejectRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "driver rejected this ride",
    data: rejectRequestRideInfo,
  });
});

const acceptRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.rideId

      await RideService.acceptRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "driver accepted this ride",
    data: {},
  });
});

const pickedUpRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.rideId

     const pickedUpRiderInfo = await RideService.pickedUpRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "driver picked up this rider",
    data: pickedUpRiderInfo,
  });
});

const inTransitRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.rideId

     const inTransitInfo = await RideService.inTransitRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "driver in-transit",
    data: inTransitInfo,
  });
});

const completedRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.rideId

     const afterCompleted = await RideService.completedRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "rides completed",
    data: afterCompleted,
  });
});

const riderFeedback = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.rideId

     await RideService.riderFeedback(req.body, rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "you has been given feedback to driver successfully",
    data: {},
  });
});

const rideHistory = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const riderId = req.params.userId

     const ridesHistory = await RideService.rideHistory(riderId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.ACCEPTED,
    message: "Rider get his ride history successfully",
    data: ridesHistory,
  });
});

const getAllRides = catchAsync(async (req: Request, res: Response) => {

     const rides = await RideService.getAllRides()

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.ACCEPTED,
    message: "All Riders Retrieved Successfully",
    data: rides,
  });
});


export const RideController = {
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
     getAllRides
}