import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { DriverControllers } from "./driver.controller";



const router = Router();

router.post("/apply/:userId", checkAuth(...Object.values(Role)), DriverControllers.createDriver)
router.patch("/:userId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.approveOrRejectDriver)
router.get("/all-drivers", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.getAllDrivers)
router.get("/earningHistory/:driverId", checkAuth(Role.DRIVER, Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.driverEarningHistory)
router.get("/singleDriver/:driverId", checkAuth(Role.DRIVER, Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.singleDriverStat)
router.get("/completedRides/:driverId", checkAuth(Role.DRIVER), DriverControllers.completedRides)


export const DriverRoutes = router;