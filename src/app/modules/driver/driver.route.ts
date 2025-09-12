import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { DriverControllers } from "./driver.controller";



const router = Router();

router.post("/apply/:userId", checkAuth(...Object.values(Role)), DriverControllers.createDriver)
router.get("/pendingDrivers", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.getPendingDrivers)
router.patch("/:userId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.approveOrRejectDriver)
router.get("/availabilityStatus", checkAuth(...Object.values(Role)), DriverControllers.getAvailabilityStatus)
router.post("/availabilityStatus", checkAuth(...Object.values(Role)), DriverControllers.availabilityStatus)
router.get("/pendingRides", checkAuth(Role.DRIVER), DriverControllers.pendingRides)

router.patch("/reject/:rideId", checkAuth(Role.DRIVER), DriverControllers.rejectRide)
router.patch("/accept/:rideId", checkAuth(Role.DRIVER), DriverControllers.acceptRide)
router.get("/activeRideStatus", checkAuth(Role.DRIVER), DriverControllers.getActiveRideStatus)
router.patch("/pickedUp/:rideId", checkAuth(Role.DRIVER), DriverControllers.pickedUpRide)
router.patch("/inTransit/:rideId", checkAuth(Role.DRIVER), DriverControllers.inTransitRide)
router.patch("/completed/:rideId", checkAuth(Role.DRIVER), DriverControllers.completedRide)

router.get("/all-drivers", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.getAllDrivers)
router.get("/earningHistory/:driverId", checkAuth(Role.DRIVER, Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.driverEarningHistory)
router.get("/singleDriver/:driverId", checkAuth(Role.DRIVER, Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.singleDriverStat)
router.get("/completedRides", checkAuth(Role.DRIVER), DriverControllers.completedRides)


export const DriverRoutes = router;