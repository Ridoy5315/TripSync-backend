import httpStatus from "http-status-codes";
import crypto from "crypto";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
// import { redisClient } from "../../config/redis.config";
import { sendEmail } from "../../utils/sendEmail";

// const OPT_EXPIRATION = 5 * 60; 

const generateOtp = (length = 6) => {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
  return otp;
};

const sendOTP = async (email: string, name: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not found");
  }

  const otp = generateOtp();

  // const redisKey = `otp:${email}`;

  // await redisClient.set(redisKey, otp, {
  //   expiration: {
  //     type: "EX",
  //     value: OPT_EXPIRATION,
  //   },
  // });

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: {
      name: name,
      otp: otp,
    },
  });
  return {};
};

const verifyOTP = async (email: string, otp: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not found");
  }

  if (user.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are already verified");
  }

  const redisKey = `otp:${email}`;
  // const savedOtp = await redisClient.get(redisKey);

  // if (!savedOtp) {
  //   throw new AppError(httpStatus.NOT_FOUND, "Invalid OTP");
  // }

  // if (savedOtp !== otp) {
  //   throw new AppError(httpStatus.NOT_ACCEPTABLE, "OTP not matching");
  // }

  await Promise.all([
    User.updateOne({ email }, { isVerified: true }, { runValidators: true }),
    // redisClient.del([redisKey]),
  ]);

};

export const OTPServices = {
  sendOTP,
  verifyOTP,
};
