import bcryptjs from "bcryptjs";
import { envVars } from "../config/env";
import { User } from "../modules/user/user.model";
import { IAuthProvider, IUser, Role } from "../modules/user/user.interface";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await User.findOne({
      email: envVars.SUPER_ADMIN_EMAIL,
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Already Exists!");
      return;
    }

    const hashedPassword = await bcryptjs.hash(
      envVars.SUPER_ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    const authProvider: IAuthProvider = {
     provider: "credentials",
     providerId: envVars.SUPER_ADMIN_EMAIL
    }

    const payload: IUser = {
     name: "Super Admin",
     email: envVars.SUPER_ADMIN_EMAIL,
     password: hashedPassword,
     role: Role.SUPER_ADMIN,
     isVerified: true,
     auths: [authProvider]
    };

    const createSuperAdmin = User.create(payload)

    console.log("Super Admin created successfully")
    console.log(createSuperAdmin)
  } catch (error) {
     console.log(error)
  }
};
