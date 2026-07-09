import express from "express";
import {
  getAllVendors,
  getVendorProfile,
  toggleVendorAvailability,
  getVendorServices,
  manageVendorServices,
  deleteVendorService,
  getVendorTrustScore,
  contactAdmin,
} from "../controllers/vendor.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { vendor } from "../middleware/role.middleware.js";


const router = express.Router();

// Public routes
router.get("/", getAllVendors); // Handles filtering by serviceSlug via query
router.get("/:id", getVendorProfile);

// Vendor-specific routes
router.get("/me/services", protect, vendor, getVendorServices);
router.put("/me/services", protect, vendor, manageVendorServices);
router.delete("/me/services/:serviceId", protect, vendor, deleteVendorService);
router.put("/availability", protect, vendor, toggleVendorAvailability);
router.post("/support", protect, vendor, contactAdmin);

export default router;