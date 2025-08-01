import httpStatus from 'http-status-codes';
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DriverServices } from "./driver.service";
import { JwtPayload } from "jsonwebtoken";
import { sendResponse } from "../../utils/sendResponse";


const createDriver = catchAsync(async (req: Request, res: Response) => {

     const decodedToken = req.user as JwtPayload;
     const userId = req.params.id
     
  const vehicleInfo = await DriverServices.createDriver(req.body, userId, decodedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User applied for be a driver Successfully",
    data: vehicleInfo,
  });
});


export const DriverControllers = {
     createDriver
}