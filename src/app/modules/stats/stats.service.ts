import { userByRole } from "../../utils/userByRole";
import { Driver } from "../driver/driver.model";
import { Ride } from "../rides/rides.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

const now = new Date();
const dateSevenDaysAgo = new Date(now);
dateSevenDaysAgo.setDate(now.getDate() - 7);
const dateThirtyDaysAgo = new Date(now);
dateThirtyDaysAgo.setDate(now.getDate() - 30);

const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const endOfToday = new Date();
endOfToday.setHours(23, 59, 59, 999);

const getUserStats = async () => {
  const totalUsersPromise = User.countDocuments();

  const totalActiveUsersPromise = User.countDocuments({
    isActive: IsActive.ACTIVE,
  });
  const totalDeleteUsersPromise = User.countDocuments({ isDeleted: true });

  const newUsersInLast7DaysPromise = User.countDocuments({
    createdAt: { $gte: dateSevenDaysAgo },
  });

  const newUsersInLast30DaysPromise = User.countDocuments({
    createdAt: { $gte: dateThirtyDaysAgo },
  });
  const [
    totalUsers,
    totalActiveUsers,
    totalDeleteUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
  ] = await Promise.all([
    totalUsersPromise,
    totalActiveUsersPromise,
    totalDeleteUsersPromise,
    newUsersInLast7DaysPromise,
    newUsersInLast30DaysPromise,
  ]);

  const role = await userByRole();

  return {
    totalUsers,
    totalActiveUsers,
    totalDeleteUsers,
    newUsersInLast7Days,
    newUsersInLast30Days,
    super_admin: role?.SUPER_ADMIN,
    admin: role?.ADMIN,
    user: role?.USER,
    rider: role?.rider,
    driver: role?.DRIVER,
  };
};

const getRiderStats = async () => {
  const totalRiderPromise = userByRole();

  const resultPromise = Ride.aggregate([
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

  const highestCanceledRiderPromise = Ride.aggregate([
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

  const totalOnTripRidersPromise = User.aggregate([
    { $match: { isOnTrip: true } },
    {
      $group: {
        _id: "$isOnTrip",
        total: { $sum: 1 },
      },
    },
    { $project: { _id: 0, total: 1 } },
  ]);

  const [totalRider, result, highestCanceledRider, totalOnTripRiders] =
    await Promise.all([
      totalRiderPromise,
      resultPromise,
      highestCanceledRiderPromise,
      totalOnTripRidersPromise,
    ]);

  return {
    totalRider: totalRider?.rider,
    highestCompletedRider: result[0].highestCompletedRider,
    highestSpendingRider: result[0].highestSpendingUser,
    highestCanceledRider: highestCanceledRider[0],
    totalOnTripRiders: totalOnTripRiders[0],
  };
};

const getRidesStats = async () => {
  const totalRidesPromise = Ride.countDocuments();
  const totalCompleteRidesPromise = Ride.countDocuments({
    rideProgressStatus: "COMPLETED",
  });
  const totalCanceledRidesPromise = Ride.countDocuments({
    rideRequestAction: "CANCELED",
  });
  const totalPendingRidesPromise = Ride.countDocuments({
    rideRequestAction: "PENDING",
  });
  const totalOngoingRidesPromise = Ride.countDocuments({
    rideRequestAction: "ACCEPTED",
    rideProgressStatus: { $ne: "COMPLETED" },
  });
  const totalRejectedRidesPromise = Ride.countDocuments({
    rideRequestAction: "REJECTED",
  });

  const todayRidesPromise = Ride.countDocuments({
    rideRequestAction: "ACCEPTED",
    createdAt: { $gte: startOfToday, $lte: endOfToday },
  });

  const ridesInLast7DaysPromise = Ride.countDocuments({
    createdAt: { $gte: dateSevenDaysAgo },
  });
  const ridesInLast30DaysPromise = Ride.countDocuments({
    createdAt: { $gte: dateThirtyDaysAgo },
  });

  const [
    totalRides,
    totalCompleteRides,
    totalCanceledRides,
    totalPendingRides,
    totalOngoingRides,
    totalRejectedRides,
    todayRides,
    ridesInLast7Days,
    ridesInLast30Days,
  ] = await Promise.all([
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
};

const getDriverStats = async () => {
  const totalDriverPromise = Driver.countDocuments();
  const totalApprovedDriverPromise = Driver.countDocuments({
    approvalStatus: "APPROVED",
  });
  const totalPendingDriverPromise = Driver.countDocuments({
    approvalStatus: "PENDING",
  });
  const totalRejectedDriverPromise = Driver.countDocuments({
    approvalStatus: "REJECTED",
  });
  const totalCurrentOnlineDriverPromise = Driver.countDocuments({
    availabilityStatus: "ONLINE",
  });
  const totalCurrentOfflineDriverPromise = Driver.countDocuments({
    availabilityStatus: "OFFLINE",
  });
  const totalCurrentOnTripDriverPromise = Driver.countDocuments({
    availabilityStatus: "ON_TRIP",
  });

  const highestRatingDriverPromise = Driver.findOne()
    .sort({ rating: -1 })
    .populate({
      path: "driverInformation",
      select: "name email phone picture address gender dateOfBirth",
    });
  const lowestRatingDriverPromise = Driver.findOne()
    .sort({ rating: 1 })
    .populate({
      path: "driverInformation",
      select: "name email phone picture address gender dateOfBirth",
    });
  const highestEaringDriverPromise = Driver.findOne()
    .sort({ totalIncome: -1 })
    .populate({
      path: "driverInformation",
      select: "name email phone picture address gender dateOfBirth",
    });
  const lowestEaringDriverPromise = Driver.findOne()
    .sort({ totalIncome: 1 })
    .populate({
      path: "driverInformation",
      select: "name email phone picture address gender dateOfBirth",
    });

  const [
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
  ] = await Promise.all([
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
};

const paymentStats = async () => {
  const totalRevenuePromise = Ride.aggregate([
    {
      $group: {
        _id: null,
        revenue: { $sum: "$companyEarning" },
      },
    },
  ]);

  const todaysRevenuePromise = Ride.aggregate([
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
  const revenueInLast7DaysPromise = Ride.aggregate([
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
  const revenueInLast30DaysPromise = Ride.aggregate([
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

  const [totalRevenue, todaysRevenue, revenueInLast7Days, revenueInLast30Days] = await Promise.all([
    totalRevenuePromise,
    todaysRevenuePromise,
    revenueInLast7DaysPromise,
    revenueInLast30DaysPromise
  ]);

  return {
    totalRevenue: totalRevenue[0].revenue,
    todaysRevenue: todaysRevenue[0]?.revenue || 0,
    revenueInLast7Days: revenueInLast7Days[0].revenue || 0,
    revenueInLast30Days: revenueInLast30Days[0].revenue || 0
  };
};

export const StatsService = {
  getUserStats,
  getRiderStats,
  getRidesStats,
  getDriverStats,
  paymentStats,
};
