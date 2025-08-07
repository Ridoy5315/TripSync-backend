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
exports.StatsService = void 0;
const userByRole_1 = require("../../utils/userByRole");
const driver_model_1 = require("../driver/driver.model");
const rides_model_1 = require("../rides/rides.model");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const now = new Date();
const dateSevenDaysAgo = new Date(now);
dateSevenDaysAgo.setDate(now.getDate() - 7);
const dateThirtyDaysAgo = new Date(now);
dateThirtyDaysAgo.setDate(now.getDate() - 30);
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);
const endOfToday = new Date();
endOfToday.setHours(23, 59, 59, 999);
const getUserStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const totalUsersPromise = user_model_1.User.countDocuments();
    const totalActiveUsersPromise = user_model_1.User.countDocuments({
        isActive: user_interface_1.IsActive.ACTIVE,
    });
    const totalDeleteUsersPromise = user_model_1.User.countDocuments({ isDeleted: true });
    const newUsersInLast7DaysPromise = user_model_1.User.countDocuments({
        createdAt: { $gte: dateSevenDaysAgo },
    });
    const newUsersInLast30DaysPromise = user_model_1.User.countDocuments({
        createdAt: { $gte: dateThirtyDaysAgo },
    });
    const [totalUsers, totalActiveUsers, totalDeleteUsers, newUsersInLast7Days, newUsersInLast30Days,] = yield Promise.all([
        totalUsersPromise,
        totalActiveUsersPromise,
        totalDeleteUsersPromise,
        newUsersInLast7DaysPromise,
        newUsersInLast30DaysPromise,
    ]);
    const role = yield (0, userByRole_1.userByRole)();
    return {
        totalUsers,
        totalActiveUsers,
        totalDeleteUsers,
        newUsersInLast7Days,
        newUsersInLast30Days,
        super_admin: role === null || role === void 0 ? void 0 : role.SUPER_ADMIN,
        admin: role === null || role === void 0 ? void 0 : role.ADMIN,
        user: role === null || role === void 0 ? void 0 : role.USER,
        rider: role === null || role === void 0 ? void 0 : role.rider,
        driver: role === null || role === void 0 ? void 0 : role.DRIVER,
    };
});
const getRiderStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const totalRiderPromise = (0, userByRole_1.userByRole)();
    const resultPromise = rides_model_1.Ride.aggregate([
        {
            $match: { rideProgressStatus: "COMPLETED" },
        },
        {
            $facet: {
                highestCompletedRider: [
                    {
                        $group: {
                            _id: "$rider",
                            completedRide: { $sum: 1 },
                        },
                    },
                    { $sort: { completedRide: -1 } },
                    { $limit: 1 },
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "_id",
                            as: "rider",
                        },
                    },
                    { $unwind: "$rider" },
                    {
                        $project: {
                            name: "$rider.name",
                            email: "$rider.email",
                            phone: "$rider.phone",
                            picture: "$rider.picture",
                            address: "$rider.address",
                            gender: "$rider.gender",
                            completedRide: 1,
                        },
                    },
                ],
                highestSpendingUser: [
                    {
                        $group: {
                            _id: "$rider",
                            totalSpend: { $sum: "$originalFare" },
                        },
                    },
                    { $sort: { totalSpend: -1 } },
                    { $limit: 1 },
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "_id",
                            as: "rider",
                        },
                    },
                    { $unwind: "$rider" },
                    {
                        $project: {
                            _id: 0,
                            name: "$rider.name",
                            email: "$rider.email",
                            phone: "$rider.phone",
                            picture: "$rider.picture",
                            address: "$rider.address",
                            gender: "$rider.gender",
                            totalSpend: 1,
                        },
                    },
                ],
            },
        },
    ]);
    const highestCanceledRiderPromise = rides_model_1.Ride.aggregate([
        {
            $match: { rideRequestAction: "CANCELED" },
        },
        {
            $group: {
                _id: "$rider",
                canceledRide: { $sum: 1 },
            },
        },
        { $sort: { canceledRide: -1 } },
        { $limit: 1 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "rider",
            },
        },
        { $unwind: "$rider" },
        {
            $project: {
                _id: 0,
                name: "$rider.name",
                email: "$rider.email",
                phone: "$rider.phone",
                picture: "$rider.picture",
                address: "$rider.address",
                gender: "$rider.gender",
                canceledRide: 1,
            },
        },
    ]);
    const totalOnTripRidersPromise = user_model_1.User.aggregate([
        { $match: { isOnTrip: true } },
        {
            $group: {
                _id: "$isOnTrip",
                total: { $sum: 1 },
            },
        },
        { $project: { _id: 0, total: 1 } },
    ]);
    const [totalRider, result, highestCanceledRider, totalOnTripRiders] = yield Promise.all([
        totalRiderPromise,
        resultPromise,
        highestCanceledRiderPromise,
        totalOnTripRidersPromise,
    ]);
    return {
        totalRider: totalRider === null || totalRider === void 0 ? void 0 : totalRider.rider,
        highestCompletedRider: result[0].highestCompletedRider,
        highestSpendingRider: result[0].highestSpendingUser,
        highestCanceledRider: highestCanceledRider[0],
        totalOnTripRiders: totalOnTripRiders[0],
    };
});
const getRidesStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const totalRidesPromise = rides_model_1.Ride.countDocuments();
    const totalCompleteRidesPromise = rides_model_1.Ride.countDocuments({
        rideProgressStatus: "COMPLETED",
    });
    const totalCanceledRidesPromise = rides_model_1.Ride.countDocuments({
        rideRequestAction: "CANCELED",
    });
    const totalPendingRidesPromise = rides_model_1.Ride.countDocuments({
        rideRequestAction: "PENDING",
    });
    const totalOngoingRidesPromise = rides_model_1.Ride.countDocuments({
        rideRequestAction: "ACCEPTED",
        rideProgressStatus: { $ne: "COMPLETED" },
    });
    const totalRejectedRidesPromise = rides_model_1.Ride.countDocuments({
        rideRequestAction: "REJECTED",
    });
    const todayRidesPromise = rides_model_1.Ride.countDocuments({
        rideRequestAction: "ACCEPTED",
        createdAt: { $gte: startOfToday, $lte: endOfToday },
    });
    const ridesInLast7DaysPromise = rides_model_1.Ride.countDocuments({
        createdAt: { $gte: dateSevenDaysAgo },
    });
    const ridesInLast30DaysPromise = rides_model_1.Ride.countDocuments({
        createdAt: { $gte: dateThirtyDaysAgo },
    });
    const [totalRides, totalCompleteRides, totalCanceledRides, totalPendingRides, totalOngoingRides, totalRejectedRides, todayRides, ridesInLast7Days, ridesInLast30Days,] = yield Promise.all([
        totalRidesPromise,
        totalCompleteRidesPromise,
        totalCanceledRidesPromise,
        totalPendingRidesPromise,
        totalOngoingRidesPromise,
        totalRejectedRidesPromise,
        todayRidesPromise,
        ridesInLast7DaysPromise,
        ridesInLast30DaysPromise,
    ]);
    return {
        totalRides,
        totalCompleteRides,
        totalCanceledRides,
        totalPendingRides,
        totalOngoingRides,
        totalRejectedRides,
        todayRides,
        ridesInLast7Days,
        ridesInLast30Days,
    };
});
const getDriverStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const totalDriverPromise = driver_model_1.Driver.countDocuments();
    const totalApprovedDriverPromise = driver_model_1.Driver.countDocuments({
        approvalStatus: "APPROVED",
    });
    const totalPendingDriverPromise = driver_model_1.Driver.countDocuments({
        approvalStatus: "PENDING",
    });
    const totalRejectedDriverPromise = driver_model_1.Driver.countDocuments({
        approvalStatus: "REJECTED",
    });
    const totalCurrentOnlineDriverPromise = driver_model_1.Driver.countDocuments({
        availabilityStatus: "ONLINE",
    });
    const totalCurrentOfflineDriverPromise = driver_model_1.Driver.countDocuments({
        availabilityStatus: "OFFLINE",
    });
    const totalCurrentOnTripDriverPromise = driver_model_1.Driver.countDocuments({
        availabilityStatus: "ON_TRIP",
    });
    const highestRatingDriverPromise = driver_model_1.Driver.findOne()
        .sort({ rating: -1 })
        .populate({
        path: "driverInformation",
        select: "name email phone picture address gender dateOfBirth",
    });
    const lowestRatingDriverPromise = driver_model_1.Driver.findOne()
        .sort({ rating: 1 })
        .populate({
        path: "driverInformation",
        select: "name email phone picture address gender dateOfBirth",
    });
    const highestEaringDriverPromise = driver_model_1.Driver.findOne()
        .sort({ totalIncome: -1 })
        .populate({
        path: "driverInformation",
        select: "name email phone picture address gender dateOfBirth",
    });
    const lowestEaringDriverPromise = driver_model_1.Driver.findOne()
        .sort({ totalIncome: 1 })
        .populate({
        path: "driverInformation",
        select: "name email phone picture address gender dateOfBirth",
    });
    const [totalDriver, totalApprovedDriver, totalPendingDriver, totalRejectedDriver, totalCurrentOnlineDriver, totalCurrentOfflineDriver, totalCurrentOnTripDriver, highestRatingDriver, lowestRatingDriver, highestEaringDriver, lowestEaringDriver,] = yield Promise.all([
        totalDriverPromise,
        totalApprovedDriverPromise,
        totalPendingDriverPromise,
        totalRejectedDriverPromise,
        totalCurrentOnlineDriverPromise,
        totalCurrentOfflineDriverPromise,
        totalCurrentOnTripDriverPromise,
        highestRatingDriverPromise,
        lowestRatingDriverPromise,
        highestEaringDriverPromise,
        lowestEaringDriverPromise,
    ]);
    return {
        totalDriver,
        totalApprovedDriver,
        totalPendingDriver,
        totalRejectedDriver,
        totalCurrentOnlineDriver,
        totalCurrentOfflineDriver,
        totalCurrentOnTripDriver,
        highestRatingDriver,
        lowestRatingDriver,
        highestEaringDriver,
        lowestEaringDriver,
    };
});
const paymentStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const totalRevenuePromise = rides_model_1.Ride.aggregate([
        {
            $group: {
                _id: null,
                revenue: { $sum: "$companyEarning" },
            },
        },
    ]);
    const todaysRevenuePromise = rides_model_1.Ride.aggregate([
        {
            $match: {
                rideProgressStatus: "COMPLETED",
                createdAt: { $gte: startOfToday, $lte: endOfToday },
            },
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: "$companyEarning" },
            },
        },
    ]);
    const revenueInLast7DaysPromise = rides_model_1.Ride.aggregate([
        {
            $match: {
                rideProgressStatus: "COMPLETED",
                createdAt: { $gte: dateSevenDaysAgo },
            },
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: "$companyEarning" },
            },
        },
    ]);
    const revenueInLast30DaysPromise = rides_model_1.Ride.aggregate([
        {
            $match: {
                rideProgressStatus: "COMPLETED",
                createdAt: { $gte: dateThirtyDaysAgo },
            },
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: "$companyEarning" },
            },
        },
    ]);
    const [totalRevenue, todaysRevenue, revenueInLast7Days, revenueInLast30Days] = yield Promise.all([
        totalRevenuePromise,
        todaysRevenuePromise,
        revenueInLast7DaysPromise,
        revenueInLast30DaysPromise
    ]);
    return {
        totalRevenue: totalRevenue[0].revenue,
        todaysRevenue: ((_a = todaysRevenue[0]) === null || _a === void 0 ? void 0 : _a.revenue) || 0,
        revenueInLast7Days: revenueInLast7Days[0].revenue || 0,
        revenueInLast30Days: revenueInLast30Days[0].revenue || 0
    };
});
exports.StatsService = {
    getUserStats,
    getRiderStats,
    getRidesStats,
    getDriverStats,
    paymentStats,
};
