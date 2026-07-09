import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Service from "../models/Service.js";
import ServiceCategory from '../models/ServiceCategory.js';

// Helper for analytics aggregation
const getAnalyticsByRange = async (model, range, dateField = 'createdAt') => {
  let format;
  switch (range) {
    case 'day':
      format = '%Y-%m-%d';
      break;
    case 'month':
      format = '%Y-%m';
      break;
    case 'year':
      format = '%Y';
      break;
    default:
      throw new Error('Invalid range');
  }

  const data = await model.aggregate([
    {
      $group: {
        _id: { $dateToString: { format, date: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    labels: data.map(item => item._id),
    data: data.map(item => item.count)
  }
};

// @desc    Get dashboard overview statistics
// @route   GET /api/admin/overview-stats
// @access  Private/Admin
export const getOverviewStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const totalVendors = await Vendor.countDocuments({});
    const totalServiceRequests = await ServiceRequest.countDocuments({});
    const totalPendingRequests = await ServiceRequest.countDocuments({ status: 'pending' });
    const totalCompletedRequests = await ServiceRequest.countDocuments({ status: 'completed' });
    const totalCategories = await ServiceCategory.countDocuments({});
    const totalServices = await Service.countDocuments({});

    res.json({
      totalUsers,
      totalCustomers,
      totalVendors,
      totalServiceRequests,
      totalPendingRequests,
      totalCompletedRequests,
      totalCategories,
      totalServices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Get all users (customers and admins, excluding vendors who have a separate model)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    // Exclude both vendors and admins, show only regular users
    const users = await User.find({ role: { $nin: ['vendor', 'admin'] } }).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Cannot delete admin user' });
      }
      // If the user is a vendor, their vendor profile should also be deleted
      if (user.role === 'vendor') {
        await Vendor.deleteOne({ user: user._id });
      }
      await user.deleteOne();
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private/Admin
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({})
      .populate('user', 'name email')
      .populate('servicesProvided.serviceId', 'name slug'); // Correctly populate nested serviceId
    res.json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a vendor and associated user
// @route   DELETE /api/admin/vendors/:id
// @access  Private/Admin
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (vendor) {
      await User.deleteOne({ _id: vendor.user }); // Delete associated user
      await vendor.deleteOne();
      res.json({ message: 'Vendor and associated user removed successfully' });
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all service requests (for admin review)
// @route   GET /api/admin/requests
// @access  Private/Admin
export const getAllServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({})
      .populate('user', 'name email')
      .populate('vendor', 'companyName') // Only companyName for vendor
      .populate('service', 'name'); // Only service name
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Get user analytics
// @route   GET /api/admin/analytics/users?range=day|month|year
// @access  Private/Admin
export const getUserAnalytics = async (req, res) => {
  try {
    const { range } = req.query;
    const data = await getAnalyticsByRange(User, range);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get vendor analytics
// @route   GET /api/admin/analytics/vendors?range=day|month|year
// @access  Private/Admin
export const getVendorAnalytics = async (req, res) => {
  try {
    const { range } = req.query;
    // We want to count actual Vendor model creations, not just User with role 'vendor'
    const data = await getAnalyticsByRange(Vendor, range);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get request analytics
// @route   GET /api/admin/analytics/requests?range=day|month|year
// @access  Private/Admin
export const getRequestAnalytics = async (req, res) => {
  try {
    const { range } = req.query;
    const data = await getAnalyticsByRange(ServiceRequest, range);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Get service request status summary
// @route GET /api/admin/analytics/status-summary
// @access Private/Admin
export const getStatusSummary = async (req, res) => {
  try {
    const statusSummary = await ServiceRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      labels: statusSummary.map(item => item._id),
      data: statusSummary.map(item => item.count),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get requests by service
// @route   GET /api/admin/analytics/requests-by-service
// @access  Private/Admin
export const getRequestsByService = async (req, res) => {
  try {
    const requests = await ServiceRequest.aggregate([
      {
        $lookup: {
          from: 'services', // The collection name for Service model
          localField: 'service',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      {
        $unwind: '$serviceDetails'
      },
      {
        $group: {
          _id: '$serviceDetails.name',
          count: { $sum: 1 },
        },
      },
      { $project: { name: '$_id', count: 1, _id: 0 } },
    ]);
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};