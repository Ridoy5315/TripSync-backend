import { User } from "./user.model";
import { IAuthProvider, IUser } from "./user.interface";
import bcryptjs from "bcryptjs";
import { envVars } from "../../config/env";
import { userSearchableFields } from "./user.onstant";
import { QueryBuilder } from "../../utils/queryBuilder";

const createUser = async (payload: Partial<IUser>) => {
  const { name, email, password } = payload;

  await User.findOne({ email });

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    auths: [authProvider],
  });

  return user;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);

  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([usersData.build(), queryBuilder.getMeta()]);

  return {
    data,
    meta,
  };
};

const getMe = async (userId: string) => {

  const user = await User.findById(userId).select("-password")
  return {
    data: user
  };
};

export const UserServices = {
  createUser,
  getAllUsers,
  getMe
};
