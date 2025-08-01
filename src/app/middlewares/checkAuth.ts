import httpStatus from 'http-status-codes';
import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from '../utils/jwt';
import { envVars } from '../config/env';
import { User } from '../modules/user/user.model';
import { IsActive } from '../modules/user/user.interface';
import { JwtPayload } from 'jsonwebtoken';

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
     const accessToken = req.headers.authorization;
     

     if(!accessToken){{
          throw new AppError(httpStatus.BAD_REQUEST, "No Token Received");
     }}
     console.log(accessToken)

     const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload;

     console.log("from checkauth", verifiedToken)

     const isUserExist = await User.findOne({email: verifiedToken.email})

     if(!isUserExist){{
          throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
     }}
     if( isUserExist.isActive === IsActive.BLOCKED ||
        isUserExist.isActive === IsActive.INACTIVE) {
          throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExist.isActive}`);
        }
        if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
      }

      if(!isUserExist.isVerified){
        throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
      }

      if(!authRoles.includes(isUserExist.role)){
          throw new AppError(
          httpStatus.BAD_REQUEST,
          "You are not permitted to view this route!!!"
        );
      }

      req.user = verifiedToken;

      next()
    } catch (error) {
     next(error)
    }
  };
