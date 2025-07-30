import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserZodSchema } from "./user.validation";
import { UserController } from "./user.controller";


const router = Router();

router.post("/register", validateRequest(createUserZodSchema), UserController.createUser)
export const UserRoutes = router;

router.get("/all-users", UserController.getAllUsers)