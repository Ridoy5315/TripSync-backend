// import { createClient } from 'redis';
// import { envVars } from './env';

// export const redisClient = createClient({
//     username: envVars.REDIS.REDIS_USERNAME,
//     password: envVars.REDIS.REDIS_PASSWORD,
//     socket: {
//         host: envVars.REDIS.REDIS_HOST,
//         port: Number(envVars.REDIS.REDIS_PORT),
//         tls: true,
//     }
// });

// // eslint-disable-next-line no-console
// redisClient.on('error', err => console.log('Redis Client Error', err));


// export const connectRedis = async() => {
//      if(!redisClient.isOpen){
//           await redisClient.connect()
//      }
// }