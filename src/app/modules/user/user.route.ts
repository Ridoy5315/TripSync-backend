import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { UserController } from "./user.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.post(
  "/register",
  validateRequest(createUserZodSchema),
  UserController.createUser
);

router.get(
  "/all-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getAllUsers
);

router.get("/me", checkAuth(...Object.values(Role)), UserController.getMe);

router.get(
  "/:userId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getSingleUser
);
router.patch(
  "/update/:userId",
  checkAuth(...Object.values(Role)),
  multerUpload.single("file"),
  validateRequest(updateUserZodSchema),
  UserController.updateUser
);

router.patch(
  "/create-emergency-contact/:userId",
  checkAuth(...Object.values(Role)),
  UserController.createEmergencyContact
);

router.patch(
  "/blockUser/:userId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserController.blockUser
);
router.patch(
  "/unblockUser/:userId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserController.unblockUser
);

router.post("/send-gps-link", checkAuth(...Object.values(Role)), UserController.sendGPSLink)

export const UserRoutes = router;

