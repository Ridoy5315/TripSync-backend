import httpStatus from 'http-status-codes';
import { Request, Response } from "express";
import { UserServices } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


const createUser = catchAsync(async(req: Request, res: Response) => {
     const user = await UserServices.createUser(req.body)

     sendResponse(res, {
          success: true,
          statusCode: httpStatus.CREATED,
          message: "User Created Successfully",
          data: user
     })
})

const getAllUsers = catchAsync(async(req: Request, res: Response) =>{
     const query = req.query;

     const result = await UserServices.getAllUsers(query as Record<string, string>)

     sendResponse(res, {
          success: true,
          statusCode: httpStatus.OK,
          message: "All Users Retrieved Successfully",
          data: result.data,
          meta: result.meta

     })
})

const getMe = catchAsync(async(req: Request, res: Response) =>{
     const decodedToken = req.user;

     const result = await UserServices.getMe(decodedToken.userId)

     sendResponse(res, {
          success: true,
          statusCode: httpStatus.OK,
          message: "My information Retrieved Successfully",
          data: result.data,

     })
})




export const UserController = {
     createUser,
     getAllUsers,
     getMe
}