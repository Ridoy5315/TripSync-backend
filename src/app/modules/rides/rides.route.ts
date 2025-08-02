import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { RideController } from "./rides.controller";


const router = Router();

router.post("/request/:id", checkAuth(...Object.values(Role)), RideController.createRide)
router.patch("/cancel/:id", checkAuth(...Object.values(Role)), RideController.cancelRide)

export const RidesRoutes = router;