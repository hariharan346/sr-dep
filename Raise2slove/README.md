# Raise2Solve

Raise2Solve is a full-stack MERN web application built to connect customers with verified service providers (vendors). It handles role-based authentication, secure dashboards, and admin management for a real-world service booking platform.

## Features

### Customers
- Register and login securely
- Browse through various service categories
- View vendor profiles before booking
- Raise service requests
- Track job and request status

### Vendors
- Vendor registration with business details
- Custom vendor dashboard
- Accept and manage service requests
- Control availability status dynamically

### Admin
- Secure admin portal
- Manage users and vendors
- Platform moderation
- Protected admin routes

## Authentication & Security
- We use JWT-based authentication
- Role-based access control (User / Vendor / Admin)
- Passwords are encrypted with bcrypt

## Tech Stack
**Frontend:** React (Vite), JavaScript (JSX), Tailwind CSS, shadcn/ui, React Router, Axios
**Backend:** Node.js, Express.js, MongoDB Atlas, Mongoose, JWT

## Running the App Locally

First, make sure you clone the repository and navigate into the root directory.

1. **Set up the backend**
   Create a `.env` file inside the `backend/` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_url
   JWT_SECRET=your_jwt_secret
   ```
   Install dependencies and start the server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Set up the frontend**
   Open a new terminal, navigate to the frontend directory, install dependencies, and start the dev server:
   ```bash
   cd src
   npm install
   npm run dev
   ```

The backend runs on `http://localhost:5000` and the frontend runs on `http://localhost:8080`.

## Future Improvements
- Add refresh token authentication
- Build a more detailed admin analytics dashboard
- Add real-time notifications for job updates
- Integrate a payment gateway
- Enable in-app chat between users and vendors

Created by Hariharan.# e2e-production-k8


