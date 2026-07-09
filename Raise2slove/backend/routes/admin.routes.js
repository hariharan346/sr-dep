import express from "express";
import {
  getOverviewStats,
  getAllUsers,
  deleteUser,
  getAllVendors,
  deleteVendor,
  getAllServiceRequests,
  getUserAnalytics,
  getVendorAnalytics,
  getRequestAnalytics,
  getStatusSummary,
  getRequestsByService,
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/role.middleware.js"; // Use the correct admin middleware

const router = express.Router();

// Dashboard Overview Stats
router.get("/overview-stats", protect, admin, getOverviewStats);

// User Management
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);

// Vendor Management
router.get("/vendors", protect, admin, getAllVendors);
router.delete("/vendors/:id", protect, admin, deleteVendor);

// Service Request Management (Admin view of all requests)
router.get("/requests", protect, admin, getAllServiceRequests);

// Analytics Routes
router.get("/analytics/users", protect, admin, getUserAnalytics);
router.get("/analytics/vendors", protect, admin, getVendorAnalytics);
router.get("/analytics/requests", protect, admin, getRequestAnalytics);
router.get("/analytics/status-summary", protect, admin, getStatusSummary);
router.get("/analytics/requests-by-service", protect, admin, getRequestsByService);

// Admin Category and Service management routes will be handled by service.routes.js
// but with admin middleware on specific routes if needed.
// For now, the general admin functionalities are in place.

export default router;