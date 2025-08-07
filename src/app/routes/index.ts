import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { DriverRoutes } from "../modules/driver/driver.route";
import { RidesRoutes } from "../modules/rides/rides.route";
import { StatsRoutes } from "../modules/stats/stats.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { OtpRoutes } from "../modules/otp/otp.route";




export const router = Router();

const moduleRoutes = [
     {
          path:"/user",
          route: UserRoutes
     },
     {
          path:"/auth",
          route: AuthRoutes
     },
     {
          path:"/driver",
          route: DriverRoutes
     },
     {
          path:"/ride",
          route: RidesRoutes
     },
     {
          path:"/stats",
          route: StatsRoutes
     },
     {
          path:"/payment",
          route: PaymentRoutes
     },
     {
          path:"/otp",
          route: OtpRoutes
     },
]

moduleRoutes.forEach(route => {
     router.use(route.path, route.route)
})