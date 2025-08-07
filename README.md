# TripSync - Ride Sharing Backend System

TripSync is a robust backend service built for a ride-sharing application. It enables smooth coordination between riders and drivers with a focus on scalability, modularity, and maintainability. The system includes role-based access, secure authentication, ride request/management, payment integration, and analytics endpoints.

---

## 🚀 Project Overview

TripSync is designed to power a full-featured ride-sharing platform. It handles user authentication, trip management, real-time ride statuses, payment processing, and more.

---

## ✅ Features

- User authentication and authorization (JWT-based)
- Role-based access control (User (Rider), Driver, Admin, SUPER_ADMIN)
- Rider request management
- Real-time ride status updates
- Driver availability and trip assignment
- Payment integration (e.g., SSLCOMMERZ)
- OTP verification via Redis
- Image upload and storage using Multer + Cloudinary (e.g., profile photos, documents)
- Admin dashboard for analytics and system management
- Monthly cancellation limits for riders
- Pagination, filtering, and sorting for all user records
- Comprehensive input validation using Zod
- Centralized error handling and secure error responses

---

## ⚙️ Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication & Authorization:** JWT (Access & Refresh Tokens), Passport.js
- **Payment Gateway:** SSLCOMMERZ
- **Validation:** Zod
- **Email Service:** Nodemailer
- **OTP Verification:** Redis
- **Image, File Upload, delete & Storage:** Multer + Cloudinary
- **PDF Generation:** PDFKit
- **Template Engine:** EJS (for dynamic server-rendered pages like invoices or email previews)
- **Environment Config:** dotenv
- **Logging:** Morgan
- **Others:** bcrypt, cookie-parser, CORS

---

## 📡 API Endpoints

Here are the main API endpoints categorized by functionality:

### 🔐 Authentication

| Method | Endpoint                         | Description                             |
|--------|----------------------------------|-----------------------------------------|
| POST   | `/api/auth/login`                | User login with credentials             |
| POST   | `/api/auth/refresh-token`        | Refresh access token                    |
| POST   | `/api/auth/logout`               | User logout                             |
| POST   | `/api/auth/change-password`      | Change current password                 |
| POST   | `/api/auth/set-password`         | Set password for google user            |
| POST   | `/api/auth/forgot-password`      | Send reset password link to email       |
| POST   | `/api/auth/reset-password`       | Reset password via token                |
| GET    | `/api/auth/google`               | Start Google login                      |
| GET    | `/api/auth/google/callback`      | Handle Google login callback            |

---

### 👤 User Management

| Method | Endpoint                           | Description                |
|--------|------------------------------------|----------------------------|
| POST   | `/api/user/register`               | Register a new user        |
| GET    | `/api/user/all-users`              | Get all users              |
| GET    | `/api/user/me`                     | Get current logged-in user |
| GET    | `/api/user/:userId`                | Get a single user by ID    |
| PATCH  | `/api/user/update/:userId`         | Update user by ID          |
| PATCH  | `/api/user/blockUser/:userId`      | Block a user by ID         |
| PATCH  | `/api/user/unblockUser/:userId`    | Unblock a user by ID       |

---

### 🚗 Ride Management

| Method | Endpoint                              | Description                            |
|--------|---------------------------------------|----------------------------------------|
| POST   | `/api/ride/request/:userId`           | Create a new ride request              |
| PATCH  | `/api/ride/cancel/:rideId`            | Cancel a ride                          |
| GET    | `/api/ride/pendingRides/:driverId`    | Get pending rides for a driver         |
| PATCH  | `/api/ride/reject/:rideId`            | Driver rejects a ride request          |
| PATCH  | `/api/ride/accept/:rideId`            | Driver accepts a ride request          |
| PATCH  | `/api/ride/pickedUp/:rideId`          | Mark ride as picked up                 |
| PATCH  | `/api/ride/inTransit/:rideId`         | Mark ride as in transit                |
| PATCH  | `/api/ride/completed/:rideId`         | Mark ride as completed                 |
| PATCH  | `/api/ride/feedback/:rideId`          | Submit feedback and rating after ride  |
| GET    | `/api/ride/rideHistory/:userId`       | Get ride history for a user            |
| GET    | `/api/ride/all-rides`                 | Get all rides                          |

---

### 🛻 Driver Management

| Method | Endpoint                               | Description                             |
|--------|----------------------------------------|-----------------------------------------|
| POST   | `/api/driver/apply/:userId`            | User applies to become a driver         |
| PATCH  | `/api/driver/:userId`                  | Admin approves or rejects driver        |
| GET    | `/api/driver/all-drivers`              | Get list of all drivers (Admin only)    |
| GET    | `/api/driver/earningHistory/:driverId` | Get earning history for a single driver |
| GET    | `/api/driver/singleDriver/:driverId`   | Get stats for a single driver           |
| GET    | `/api/driver/completedRides/:driverId` | Get completed rides for a driver        |

---

### 🔢 OTP Verification

| Method | Endpoint           | Description           |
|--------|--------------------|-----------------------|
| POST   | `/api/otp/send`    | Send OTP to user      |
| POST   | `/api/otp/verify`  | Verify submitted OTP  |

---

### 💰 Payment

| Method | Endpoint                               | Description                           |
|--------|----------------------------------------|---------------------------------------|
| POST   | `/api/payment/init-payment/:rideId`    | Initiate payment for a ride           |
| POST   | `/api/payment/success`                 | Handle successful payment callback    |
| POST   | `/api/payment/fail`                    | Handle failed payment callback        |
| POST   | `/api/payment/cancel`                  | Handle cancelled payment callback     |
| POST   | `/api/payment/validate-payment`        | Validate payment                      |
| GET    | `/api/payment/invoice/:paymentId`      | Get invoice download URL              |

---

### 📊 Admin & Stats

| Method | Endpoint            | Description                  |
|--------|---------------------|------------------------------|
| GET    | `/api/admin/user`   | Get overall user statistics  |
| GET    | `/api/admin/rider`  | Get rider statistics         |
| GET    | `/api/admin/rides`  | Get ride-related statistics  |
| GET    | `/api/admin/driver` | Get driver statistics        |
| GET    | `/api/admin/payment`| Get payment statistics       |

---

## 📁 Project Structure

<pre><code>
src/
├── app.ts 
├── server.ts 
├── app/ 
│ ├── config/ 
│ ├── constants.ts 
│ ├── errorhelpers/ 
│ ├── helpers/ 
│ ├── interfaces/
│ ├── middlewares/ 
│ ├── modules/ 
│ │ ├── auth/
│ │ ├── driver/
│ │ ├── otp/
│ │ ├── payment/
│ │ ├── rides/
│ │ ├── sslCommerz/
│ │ ├── stats/
│ │ └── user/
│ ├── routes/ 
│ └── utils/ 
</code></pre>

---

## 🧪 Running Locally

<pre><code>
https://github.com/Ridoy5315/TripSync-backend.git
cd #folder name
npm install
npm run dev
</code></pre>

---

### Make sure to create a .env file with the following env.example file. env.example file has been included in the github.
