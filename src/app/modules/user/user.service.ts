import httpStatus from "http-status-codes";
import { User } from "./user.model";
import { IAuthProvider, IsActive, IUser, Role } from "./user.interface";
import bcryptjs from "bcryptjs";
import { envVars } from "../../config/env";
import { userSearchableFields } from "./user.onstant";
import { QueryBuilder } from "../../utils/queryBuilder";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";

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

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getSingleUser = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  if (
    decodedToken.role === Role.USER ||
    decodedToken.role === Role.DRIVER 
  ) {
    if (userId !== decodedToken.userId) {
      throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
    }
  }

  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (
    decodedToken.role === Role.ADMIN &&
    isUserExist.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Your are not authorized");
  }

  if (payload.role) {
    if (
      decodedToken.role === Role.USER ||
      decodedToken.role === Role.DRIVER 
    ) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (
      decodedToken.role === Role.USER ||
      decodedToken.role === Role.DRIVER 
    ) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, {...payload, isOnTrip: false}, {
    new: true,
    runValidators: true,
  });

  return newUpdatedUser;
};

const blockUser = async (
  userId: string,
  decodedToken: JwtPayload
) => {
  if(decodedToken.role === Role.USER || decodedToken.role === Role.DRIVER){
    throw new AppError(httpStatus.NOT_FOUND, "You are not permitted to block or unblock user");
  }

  const isUserExist = await User.findById(userId);

  if(!isUserExist){
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if(isUserExist.isActive === IsActive.BLOCKED){
    throw new AppError(httpStatus.NOT_FOUND, "this user already blocked");
  }

  await User.findByIdAndUpdate(userId, {isActive: IsActive.BLOCKED}, {new : true, runValidators: true})

  
};

const unblockUser = async (userId: string, decodedToken: JwtPayload) => {

  if(decodedToken.role === Role.USER || decodedToken.role === Role.DRIVER){
    throw new AppError(httpStatus.NOT_FOUND, "You are not permitted to block or unblock user");
  }

  const isUserExist = await User.findById(userId);

  if(!isUserExist){
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if(isUserExist.isActive !== IsActive.BLOCKED){
    throw new AppError(httpStatus.NOT_FOUND, "this user not a blocked user");
  }

  await User.findByIdAndUpdate(userId, {isActive: IsActive.ACTIVE}, {new : true, runValidators: true})

  
};

export const UserServices = {
  createUser,
  getAllUsers,
  getMe,
  getSingleUser,
  updateUser,
  blockUser,
  unblockUser
};
