import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { RideController } from "./rides.controller";


const router = Router();

router.post("/request/:id", checkAuth(...Object.values(Role)), RideController.createRide)
router.patch("/cancel/:id", checkAuth(...Object.values(Role)), RideController.cancelRide)
router.patch("/reject/:id", checkAuth(Role.DRIVER), RideController.rejectRide)
router.patch("/accept/:id", checkAuth(Role.DRIVER), RideController.acceptRide)
router.patch("/pickedUp/:id", checkAuth(Role.DRIVER), RideController.pickedUpRide)
router.patch("/inTransit/:id", checkAuth(Role.DRIVER), RideController.inTransitRide)
router.patch("/completed/:id", checkAuth(Role.DRIVER), RideController.completedRide)

export const RidesRoutes = router;