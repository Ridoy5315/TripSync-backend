import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { UserController } from "./user.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";


const router = Router();

router.post("/register", validateRequest(createUserZodSchema), UserController.createUser)
export const UserRoutes = router;

router.get("/all-users",checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserController.getAllUsers)

router.get("/me", checkAuth(...Object.values(Role)), UserController.getMe)

router.get("/:userId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserController.getSingleUser)
router.patch("/:userId",validateRequest(updateUserZodSchema), checkAuth(...Object.values(Role)), UserController.updateUser)
router.patch("/blockUser/:userId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserController.blockUser)
router.patch("/unblockUser/:userId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserController.unblockUser)