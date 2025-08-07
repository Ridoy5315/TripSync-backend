import express, {  Request, Response } from "express";
import { router } from "./app/routes";
import cors from "cors"
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFoundRoute from "./app/middlewares/notFoundRoute";
import cookieParser from "cookie-parser";
import passport from "passport";
import expressSession from "express-session"
import { envVars } from "./app/config/env";
import "./app/config/passport";


const app = express()

app.use(expressSession({
     secret: envVars.EXPRESS_SESSION_SECRET,
     resave: false,
     saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser())
app.use(express.json())
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true}))
app.use(cors({
     origin : envVars.FRONTEND_URL,
     credentials: true
}))

app.use("/api", router)

app.get("/", (req: Request, res: Response) => {
     res.status(200).json({
          message: "Welcome to TripSync(Backend)"
     })
})

app.use(globalErrorHandler)

app.use(notFoundRoute)

export default app;