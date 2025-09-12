import httpStatus from "http-status-codes";
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const userStats = await StatsService.getUserStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users stats",
    data: userStats,
  });
});

const getRiderStats = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const riderStats = await StatsService.getRiderStats(
    query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Riders stats",
    data: riderStats,
  });
});

const getRidesStats = catchAsync(async (req: Request, res: Response) => {
  const ridesStats = await StatsService.getRidesStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rides stats",
    data: ridesStats,
  });
});

const getDriverStats = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const driversStats = await StatsService.getDriverStats(query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Driver stats",
    data: driversStats,
  });
});

const paymentStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.paymentStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment stats",
    data: stats,
  });
});

const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const query = req.query

  const admins = await StatsService.getAdminStats(query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "get admin successfully",
    data: admins,
  });
});

export const StatsController = {
  getUserStats,
  getRiderStats,
  getRidesStats,
  getDriverStats,
  paymentStats,
  getAdminStats
};
