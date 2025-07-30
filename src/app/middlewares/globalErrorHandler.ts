/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express"
import { envVars } from "../config/env"
import AppError from "../errorHelpers/AppError"
import { handleValidationError } from "../helpers/handleValidationError"
import { TErrorSources } from "../interfaces/error.types"
import { handleDuplicateError } from "../helpers/handleDuplicateError"

/* eslint-disable @typescript-eslint/no-explicit-any */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
     let statusCode = 500
     let message = "Something Wen Wrong!"
     let errorSources: TErrorSources[] = [];

     if(err.code === 11000){
          const simplifiedError = handleDuplicateError(err);
          statusCode = simplifiedError.statusCode;
          message = simplifiedError.message
     }

     else if(err.name === "ValidationError"){
          const simplifiedError = handleValidationError(err);

          statusCode = simplifiedError.statusCode;
          errorSources = simplifiedError.errorSources as TErrorSources[];
          message = simplifiedError.message
     }

     else if(err instanceof AppError){
          statusCode = err.statusCode
          message = err.message
     }
     else if(err instanceof Error){
          statusCode = 500
          message = err.message
     }
     res.status(statusCode).json({
          success: false,
          message,
          errorSources,
          err: envVars.NODE_ENV === "development" ? err : null,
          stack: envVars.NODE_ENV === 'development' ? err.stack : null
     })
}