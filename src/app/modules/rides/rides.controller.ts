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
     const userId = req.params.id

     const createRequestRideInfo = await RideService.cancelRide(userId, decodedToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Your ride request has been canceled",
    data: createRequestRideInfo,
  });
});


export const RideController = {
     createRide,
     cancelRide
}