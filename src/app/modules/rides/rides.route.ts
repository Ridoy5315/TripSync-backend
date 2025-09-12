import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { RideController } from "./rides.controller";


const router = Router();

router.post("/request/:userId", checkAuth(...Object.values(Role)), RideController.createRide)
router.patch("/cancel/:rideId", checkAuth(...Object.values(Role)), RideController.cancelRide)
router.patch("/feedback/:rideId", checkAuth(...Object.values(Role)), RideController.riderFeedback)
router.get("/ride-details", checkAuth(...Object.values(Role)), RideController.rideDetails)
router.get("/rideHistory/:userId", checkAuth(...Object.values(Role)), RideController.rideHistory)
router.get("/all-rides", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), RideController.getAllRides)
router.get("/all-rides-stats", RideController.getAllRidesStats)


export const RidesRoutes = router;