import httpStatus from 'http-status-codes';
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from './stats.service';


const getUserStats = catchAsync(async (req: Request, res: Response) => {

     const userStats = await StatsService.getUserStats()

     sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users stats",
    data: userStats,
  });
});

const getRiderStats = catchAsync(async (req: Request, res: Response) => {

     const riderStats = await StatsService.getRiderStats()

     sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Riders stats",
    data: riderStats,
  });
});

export const StatsController = {
     getUserStats,
     getRiderStats
}

