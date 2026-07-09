import Report from "../models/Report.js";

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private (User)
export const createReport = async (req, res) => {
  const { vendor, reason, description } = req.body;
  const user = req.user._id;

  try {
    const report = await Report.create({
      vendor,
      user,
      reason,
      description,
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private (Admin)
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate("vendor", "companyName")
      .populate("user", "name email");
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
