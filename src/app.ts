/* eslint-disable @typescript-eslint/no-explicit-any */
import express, {  Request, Response } from "express";
import { router } from "./app/routes";
import cors from "cors"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFoundRoute from "./app/middlewares/notFoundRoute";

const app = express()

app.use(express.json())
app.use(cors())

app.use("api", router)

app.get("/", (req: Request, res: Response) => {
     res.status(200).json({
          message: "Welcome to TripSync(Backend)"
     })
})

app.use(globalErrorHandler)

app.use(notFoundRoute)

export default app;