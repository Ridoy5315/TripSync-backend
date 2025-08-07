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
Object.defineProperty(exports, "__esModule", { value: true });
exports.userByRole = void 0;
const user_model_1 = require("../modules/user/user.model");
const userByRole = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_model_1.User.aggregate([
        {
            $group: {
                _id: "$role",
                count: { $sum: 1 },
                riderCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$role", "USER"] },
                                    { $ne: ["$phone", null] },
                                    { $ne: ["$picture", null] },
                                    { $ne: ["$address", null] },
                                    { $ne: ["$dateOfBirth", null] },
                                    { $ne: ["$gender", null] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
    ]);
    const role = {};
    users.forEach(({ _id, count, riderCount }) => {
        role[_id] = count;
        if (_id === "USER") {
            role["rider"] = riderCount;
        }
    });
    return role;
});
exports.userByRole = userByRole;
