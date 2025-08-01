import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { DriverControllers } from "./driver.controller";



const router = Router();

router.post("/apply/:id", checkAuth(...Object.values(Role)), DriverControllers.createDriver)
router.patch("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DriverControllers.approveOrRejectDriver)


export const DriverRoutes = router;