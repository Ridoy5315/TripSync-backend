import { User } from "../modules/user/user.model";

export const userByRole = async() =>{
  const users = await User.aggregate([
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

   const role: Record<string, number> = {};

  users.forEach(({_id, count, riderCount}) => {
     role[_id] = count;
     if(_id === "USER") {
          role["rider"] = riderCount;
     }
   })

   return role
}


 