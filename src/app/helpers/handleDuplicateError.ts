/* eslint-disable @typescript-eslint/no-explicit-any */
export const handleDuplicateError = (err: any) => {
     const matchArray = err.message.match(/"([^"]*)"/);

     return {
          statusCode: 400,
          message: `${matchArray[1]} already exist}`
     }
}