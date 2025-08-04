import { userByRole } from "../../utils/userByRole";
import { Ride } from "../rides/rides.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

const now = new Date();
const dateSevenDaysAgo = new Date(now);
dateSevenDaysAgo.setDate(now.getDate() - 7);
const dateThirtyDaysAgo = new Date(now);
dateThirtyDaysAgo.setDate(now.getDate() - 30);

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
    }
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
  ])

  const totalOnTripRidersPromise = User.aggregate([
     { $match: {isOnTrip: true}},
     {
          $group: {
               _id: "$isOnTrip",
               total: {$sum: 1}
          }
     },
     { $project: {_id: 0, total: 1}}
  ])


  const [totalRider, result, highestCanceledRider, totalOnTripRiders] = await Promise.all([
    totalRiderPromise,
    resultPromise,
    highestCanceledRiderPromise,
    totalOnTripRidersPromise
  ]);

  return {
    totalRider: totalRider?.rider,
    highestCompletedRider: result[0].highestCompletedRider,
    highestSpendingRider: result[0].highestSpendingUser,
    highestCanceledRider: highestCanceledRider[0],
    totalOnTripRiders: totalOnTripRiders[0]
  };
};

export const StatsService = {
  getUserStats,
  getRiderStats,
};
