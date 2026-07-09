import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryBySlug,
  getAllCategories,
  createService,
  updateService,
  deleteService,
  getServiceBySlug,
  getAllServices,
} from "../controllers/service.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { getVendorsByServiceSlug } from "../controllers/vendor.controller.js";

const router = express.Router();

// Public routes for categories
router.get("/categories", getAllCategories);
router.get("/categories/:slug", getCategoryBySlug);

// Public routes for services
router.get("/services", getAllServices);
router.get("/services/:slug", getServiceBySlug);
router.get("/services/:slug/vendors", getVendorsByServiceSlug);

// Admin only routes for categories
router.post("/categories", protect, admin, upload.single("image"), createCategory);
router.put("/categories/:id", protect, admin, upload.single("image"), updateCategory);
router.delete("/categories/:id", protect, admin, deleteCategory);

// Admin only routes for services
router.post("/services", protect, admin, upload.single("image"), createService);
router.put("/services/:id", protect, admin, upload.single("image"), updateService);
router.delete("/services/:id", protect, admin, deleteService);

export default router;