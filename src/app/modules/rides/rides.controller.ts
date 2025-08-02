import httpStatus from 'http-status-codes';
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RideService } from "./rides.service";
import { JwtPayload } from "jsonwebtoken";


const createRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const userId = req.params.id;

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
     const rideId = req.params.id

     const createRequestRideInfo = await RideService.cancelRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Your ride request has been canceled",
    data: createRequestRideInfo,
  });
});

const rejectRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.id

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
     const rideId = req.params.id

     const acceptRequestRideInfo = await RideService.acceptRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "driver accepted this ride",
    data: acceptRequestRideInfo,
  });
});

const pickedUpRide = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const rideId = req.params.id

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
     const rideId = req.params.id

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
     const rideId = req.params.id

     const afterCompleted = await RideService.completedRide(rideId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "rides completed",
    data: afterCompleted,
  });
});


export const RideController = {
     createRide,
     cancelRide,
     rejectRide,
     acceptRide,
     pickedUpRide,
     inTransitRide,
     completedRide
}