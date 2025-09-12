"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const user_model_1 = require("./user.model");
const user_interface_1 = require("./user.interface");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../../config/env");
const user_onstant_1 = require("./user.onstant");
const queryBuilder_1 = require("../../utils/queryBuilder");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const cloudinary_config_1 = require("../../config/cloudinary.config");
const driver_model_1 = require("../driver/driver.model");
const sendEmail_1 = require("../../utils/sendEmail");
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = payload;
    yield user_model_1.User.findOne({ email });
    const hashedPassword = yield bcryptjs_1.default.hash(password, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    const authProvider = {
        provider: "credentials",
        providerId: email,
    };
    const user = yield user_model_1.User.create({
        name,
        email,
        password: hashedPassword,
        auths: [authProvider],
    });
    return user;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new queryBuilder_1.QueryBuilder(user_model_1.User.find(), query);
    const usersData = queryBuilder
        .filter()
        .search(user_onstant_1.userSearchableFields)
        .sort()
        .fields()
        .paginate();
    const [data, meta] = yield Promise.all([
        usersData.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User not found");
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === "DRIVER") {
        const driverInfo = yield driver_model_1.Driver.findOne({ driverInformation: user._id });
        const vehicleInfo = yield driver_model_1.VehicleInfo.findOne({ owner: driverInfo === null || driverInfo === void 0 ? void 0 : driverInfo._id });
        return {
            data: {
                user,
                driverInfo,
                vehicleInfo,
            },
        };
    }
    return {
        data: {
            user,
        },
    };
});
const getSingleUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    return {
        data: user,
    };
});
const updateUser = (userId, payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.DRIVER) {
        if (userId !== decodedToken.userId) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not authorized");
        }
    }
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (decodedToken.role === user_interface_1.Role.ADMIN &&
        isUserExist.role === user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Your are not authorized");
    }
    if (payload.role) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.DRIVER) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
    }
    if (payload.isActive || payload.isDeleted || payload.isVerified) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.DRIVER) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
    }
    const newUpdatedUser = yield user_model_1.User.findByIdAndUpdate(userId, Object.assign(Object.assign({}, payload), { isOnTrip: false }), {
        new: true,
        runValidators: true,
    });
    if (payload.picture && isUserExist.picture) {
        yield (0, cloudinary_config_1.deleteImageFromCloudinary)(isUserExist.picture);
    }
    return newUpdatedUser;
});
const blockUser = (userId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not permitted to block or unblock user");
    }
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (isUserExist.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "this user already blocked");
    }
    yield user_model_1.User.findByIdAndUpdate(userId, { isActive: user_interface_1.IsActive.BLOCKED }, { new: true, runValidators: true });
});
const unblockUser = (userId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "You are not permitted to block or unblock user");
    }
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (isUserExist.isActive !== user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "this user not a blocked user");
    }
    yield user_model_1.User.findByIdAndUpdate(userId, { isActive: user_interface_1.IsActive.ACTIVE }, { new: true, runValidators: true });
});
const createEmergencyContact = (userId, decodedToken, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { emergencyContact } = payload;
    if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.DRIVER) {
        if (userId !== decodedToken.userId) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are not authorized");
        }
    }
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (decodedToken.role === user_interface_1.Role.ADMIN &&
        isUserExist.role === user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Your are not authorized");
    }
    const addedEmergencyContact = yield user_model_1.User.findByIdAndUpdate(userId, { $addToSet: { emergencyContact: emergencyContact } }, {
        new: true,
        runValidators: true,
    });
    return addedEmergencyContact;
});
const sendGPSLink = (decodedToken, gpsLink) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = decodedToken.userId;
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    (0, sendEmail_1.sendEmail)({
        from: isUserExist === null || isUserExist === void 0 ? void 0 : isUserExist.email,
        to: (_b = (_a = isUserExist === null || isUserExist === void 0 ? void 0 : isUserExist.emergencyContact) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : (() => { throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Emergency contact not found"); })(),
        subject: `🚨 SOS Alert: ${isUserExist.name} Needs Help – Location Attached`,
        templateName: "sos-alert",
        templateData: {
            userName: isUserExist === null || isUserExist === void 0 ? void 0 : isUserExist.name,
            gpsLink: gpsLink
        },
    });
    return {};
});
exports.UserServices = {
    createUser,
    getAllUsers,
    getMe,
    getSingleUser,
    updateUser,
    blockUser,
    unblockUser,
    createEmergencyContact,
    sendGPSLink,
};
