import { Router } from "express"
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { StatsController } from "./stats.controller";


const router = Router();

router.get("/user", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), StatsController.getUserStats)
router.get("/rider", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), StatsController.getRiderStats)
router.get("/rides", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), StatsController.getRidesStats)
router.get("/driver", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), StatsController.getDriverStats)
router.get("/payment", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), StatsController.paymentStats)

export const StatsRoutes = router