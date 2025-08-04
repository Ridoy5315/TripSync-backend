import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { RideController } from "./rides.controller";


const router = Router();

router.post("/request/:userId", checkAuth(...Object.values(Role)), RideController.createRide)
router.patch("/cancel/:rideId", checkAuth(...Object.values(Role)), RideController.cancelRide)
router.patch("/pendingRides/:driverId", checkAuth(Role.DRIVER), RideController.pendingRides)
router.patch("/reject/:rideId", checkAuth(Role.DRIVER), RideController.rejectRide)
router.patch("/accept/:rideId", checkAuth(Role.DRIVER), RideController.acceptRide)
router.patch("/pickedUp/:rideId", checkAuth(Role.DRIVER), RideController.pickedUpRide)
router.patch("/inTransit/:rideId", checkAuth(Role.DRIVER), RideController.inTransitRide)
router.patch("/completed/:rideId", checkAuth(Role.DRIVER), RideController.completedRide)
router.patch("/feedback/:rideId", checkAuth(...Object.values(Role)), RideController.riderFeedback)
router.get("/rideHistory/:userId", checkAuth(...Object.values(Role)), RideController.rideHistory)
router.get("/all-rides", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), RideController.getAllRides)


export const RidesRoutes = router;