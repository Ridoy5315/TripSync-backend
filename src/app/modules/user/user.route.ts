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

router.get("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserController.getSingleUser)
router.patch("/:id",validateRequest(updateUserZodSchema), checkAuth(...Object.values(Role)), UserController.updateUser)