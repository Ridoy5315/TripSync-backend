import { Request, Response } from 'express';
import httpStatus from 'http-status-codes';

const notFoundRoute = (req: Request, res: Response) => {
     res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Route not found"
     })
}

export default notFoundRoute