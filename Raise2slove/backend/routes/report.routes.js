import express from "express";
import {
  createReport,
  getAllReports,
} from "../controllers/report.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/role.middleware.js";

const router = express.Router();

// @route   POST /api/reports
// @desc    Create a new report
// @access  Private (User)
router.post("/", protect, createReport);

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private (Admin)
router.get("/", protect, admin, getAllReports);

export default router;
