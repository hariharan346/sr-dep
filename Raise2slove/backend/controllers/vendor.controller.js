import mongoose from "mongoose";
import Vendor from "../models/Vendor.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

export const getAllVendors = async (req, res) => {
  const { serviceId, location, sortBy } = req.query;

  try {
    let query = { isAvailable: true };

    // 1. Filter by Service
    if (serviceId) {
      const serviceObjectId = new mongoose.Types.ObjectId(serviceId);
      query["servicesProvided"] = {
        $elemMatch: {
          serviceId: serviceObjectId,
          isActive: true
        }
      };
    }

    // 2. Filter by Location
    if (location) {
      // Case-insensitive/partial match
      query.location = { $regex: location, $options: "i" };
    }

    // 3. Sorting Logic
    let sortOptions = {};
    if (sortBy === "price_asc" && serviceId) {
      // Determine minPrice for the specific service?
      // Sorting by array element field is tricky in basic find().
      // We might need aggregate if we want precise sorting by the specific service's price.
      // But for simple implementation:
      // We can sort by 'servicesProvided.minPrice' but that considers ALL services.
      // However, since we filtered by elemMatch, the docs that match have at least one valid service.
      // Accurate price sorting is best done in memory after mapping if dataset is small, or via aggregation.
      // Let's use aggregation for robust search.
    }

    // -- Switching to Aggregation Pipeline for Robust Handling --
    const pipeline = [];

    // Match Stage
    const matchStage = { isAvailable: true };
    if (location) {
      matchStage.location = { $regex: location, $options: "i" };
    }
    pipeline.push({ $match: matchStage });

    // Lookup Service details if needed or just filter
    if (serviceId) {
      const serviceObjectId = new mongoose.Types.ObjectId(serviceId);
      pipeline.push({
        $match: {
          servicesProvided: {
            $elemMatch: { serviceId: serviceObjectId, isActive: true }
          }
        }
      });

      // Add a field for the specific service price for sorting
      pipeline.push({
        $addFields: {
          matchedService: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$servicesProvided",
                  as: "sp",
                  cond: { $eq: ["$$sp.serviceId", serviceObjectId] }
                }
              },
              0
            ]
          }
        }
      });
    }

    // Sorting Stage
    let sortStage = {};
    switch (sortBy) {
      case "price_asc":
        if (serviceId) sortStage = { "matchedService.minPrice": 1 };
        break;
      case "price_desc":
        if (serviceId) sortStage = { "matchedService.minPrice": -1 };
        break;
      case "rating_desc":
        sortStage = { ratingAverage: -1 };
        break;
      case "name_asc":
        sortStage = { companyName: 1 };
        break;
      case "name_desc":
        sortStage = { companyName: -1 };
        break;
      default:
        // Default sort: if location provided, maybe prioritize exact match?
        // Simple default: Trust Score
        sortStage = { trustScore: -1 };
    }

    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    // Lookup User details
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    });
    pipeline.push({ $unwind: "$user" }); // Vendor must have a user

    // Lookup Services for detail populating (optional, but good for display)
    pipeline.push({
      $lookup: {
        from: "services",
        localField: "servicesProvided.serviceId",
        foreignField: "_id",
        as: "populatedServices"
      }
    });

    const vendors = await Vendor.aggregate(pipeline);

    // Format Response
    const formattedVendors = vendors.map(vendor => {
      let matchedServicePrices = { minPrice: null, maxPrice: null };

      // If we used aggregation with serviceId, we have matchedService
      if (vendor.matchedService) {
        matchedServicePrices.minPrice = vendor.matchedService.minPrice;
        matchedServicePrices.maxPrice = vendor.matchedService.maxPrice;
      } else if (serviceId) {
        // Fallback if not using aggregation addFields path (e.g. simple find)
        const s = vendor.servicesProvided.find(sp => sp.serviceId.toString() === serviceId);
        if (s) {
          matchedServicePrices.minPrice = s.minPrice;
          matchedServicePrices.maxPrice = s.maxPrice;
        }
      }

      return {
        _id: vendor._id,
        companyName: vendor.companyName,
        phone: vendor.phone,
        location: vendor.location,
        trustScore: vendor.trustScore,
        ratingAverage: vendor.ratingAverage,
        reviewCount: vendor.reviewCount,
        ...matchedServicePrices,
        user: { _id: vendor.user._id, name: vendor.user.name, email: vendor.user.email },
        // servicesProvided: vendor.servicesProvided // Optional: return all services?
      };
    });

    res.json(formattedVendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate("user", "name email")
      .populate("servicesProvided.serviceId"); // Populate the service details within servicesProvided

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const vendorObj = vendor.toObject();
    vendorObj.servicesProvided = vendorObj.servicesProvided.map(serviceEntry => {
      const serviceData = serviceEntry.serviceId; // The populated Service object
      return {
        _id: serviceData._id,
        name: serviceData.name,
        description: serviceData.description,
        image: serviceData.image,
        minPrice: serviceEntry.minPrice,
        maxPrice: serviceEntry.maxPrice,
      };
    });

    res.json(vendorObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleVendorAvailability = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    vendor.isAvailable = !vendor.isAvailable;
    await vendor.save();

    res.json({
      message: "Vendor availability updated successfully",
      isAvailable: vendor.isAvailable,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorServices = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id })
      .populate("servicesProvided.serviceId");

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const formattedServices = vendor.servicesProvided.map(serviceEntry => {
      const serviceData = serviceEntry.serviceId;
      return {
        _id: serviceData._id,
        name: serviceData.name,
        description: serviceData.description,
        image: serviceData.image,
        minPrice: serviceEntry.minPrice,
        maxPrice: serviceEntry.maxPrice,
      };
    });

    res.json(formattedServices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const manageVendorServices = async (req, res) => {
  const { servicesProvided } = req.body; // Expect an array of { serviceId, minPrice, maxPrice }

  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    // Validate incoming servicesProvided array
    if (!Array.isArray(servicesProvided)) {
      return res.status(400).json({ message: "servicesProvided must be an array" });
    }

    const newServicesProvided = [];
    const seenServiceIds = new Set();

    for (const service of servicesProvided) {
      const { serviceId, minPrice, maxPrice, isActive } = service;

      if (!serviceId || minPrice === undefined || maxPrice === undefined) {
        return res.status(400).json({ message: "Each service must have serviceId, minPrice, and maxPrice" });
      }

      // Check for duplicate serviceId in the incoming array
      if (seenServiceIds.has(serviceId.toString())) {
        return res.status(400).json({ message: `Duplicate serviceId ${serviceId} found in request.` });
      }
      seenServiceIds.add(serviceId.toString());

      // Check if serviceId is valid
      const existingService = await Service.findById(serviceId);
      if (!existingService) {
        return res.status(400).json({ message: `Service with ID ${serviceId} not found` });
      }

      // Validate prices
      if (minPrice < 0 || maxPrice < 0 || minPrice >= maxPrice) {
        return res.status(400).json({ message: `Invalid price range for service ${existingService.name}` });
      }

      newServicesProvided.push({
        serviceId: existingService._id,
        minPrice: Number(minPrice),
        maxPrice: Number(maxPrice),
        isActive: isActive !== undefined ? isActive : true,
      });
    }

    vendor.servicesProvided = newServicesProvided;
    await vendor.save();

    // Populate and format the response
    const updatedVendor = await Vendor.findById(vendor._id)
      .populate("servicesProvided.serviceId");

    const formattedServices = updatedVendor.servicesProvided.map(serviceEntry => {
      const serviceData = serviceEntry.serviceId;
      return {
        _id: serviceData._id,
        name: serviceData.name,
        description: serviceData.description,
        image: serviceData.image,
        minPrice: serviceEntry.minPrice,
        maxPrice: serviceEntry.maxPrice,
        isActive: serviceEntry.isActive,
      };
    });

    res.json({ message: "Vendor services updated successfully", services: formattedServices });
  } catch (error) {
    console.error("manageVendorServices: Error:", error); // Enhanced error logging
    res.status(500).json({ message: error.message });
  }
};

export const deleteVendorService = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const vendor = await Vendor.findOne({ user: req.user.id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const initialServiceCount = vendor.servicesProvided.length;
    vendor.servicesProvided = vendor.servicesProvided.filter(
      (service) => service.serviceId.toString() !== serviceId
    );

    if (vendor.servicesProvided.length === initialServiceCount) {
      return res.status(404).json({ message: "Service not found in vendor's offerings" });
    }

    await vendor.save();
    res.json({ message: "Service removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate trust score
export const calculateTrustScore = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    console.error(`Vendor with ID ${vendorId} not found for trust score calculation.`);
    return;
  }

  const { totalJobs, acceptedJobs, cancelledJobs, ratingAverage } = vendor;

  let score = 0;
  if (totalJobs > 0) {
    const acceptanceRate = acceptedJobs / totalJobs;
    const cancellationRate = cancelledJobs / totalJobs;

    // Simple formula: 70% from acceptance, 30% from non-cancellation
    // Can be made more complex with ratingAverage and avgResponseTime
    score = (acceptanceRate * 70) + ((1 - cancellationRate) * 30);
  }

  // Ensure score is within 0-100
  vendor.trustScore = Math.max(0, Math.min(100, Math.round(score)));
  await vendor.save();
  return vendor.trustScore;
};

export const getVendorTrustScore = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId).select("trustScore");
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.json({ trustScore: vendor.trustScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const contactAdmin = async (req, res) => {
  const { issueType, description } = req.body;
  const vendor = await Vendor.findOne({ user: req.user.id }).populate("user", "name email");

  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  const subject = `Vendor Support Request: ${issueType}`;
  const message = `
    <h2>Vendor Support Request</h2>
    <p><strong>Vendor Name:</strong> ${vendor.user.name}</p>
    <p><strong>Vendor Company:</strong> ${vendor.companyName}</p>
    <p><strong>Vendor Email:</strong> ${vendor.user.email}</p>
    <p><strong>Issue Type:</strong> ${issueType}</p>
    <hr />
    <h3>Description:</h3>
    <p>${description}</p>
  `;

  try {
    await sendEmail({
      subject,
      message,
    });
    res.json({ message: "Support request sent successfully." });
  } catch (error) {
    console.error("Error sending support email:", error);
    res.status(500).json({ message: "Failed to send support request." });
  }
};

export const getVendorsByServiceSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { sortBy } = req.query;

    // 1️⃣ Find service by slug
    const service = await Service.findOne({ slug });

    if (!service) {
      return res.status(404).json({ message: "Service Not Found" });
    }

    // 2️⃣ Find vendors providing this service (and active)
    const query = {
      "servicesProvided": {
        $elemMatch: {
          serviceId: service._id,
          isActive: { $ne: false } // Matches true or missing
        }
      },
      // isAvailable: true // Show all vendors
    };

    let vendors = await Vendor.find(query)
      .populate("user", "name email mobile");

    // 3️⃣ Format response to include specific price for this service
    // Temporary Fix: Force all vendors to be available to correct stale data from previous testing
    // This ensures that vendors who were "locked" are now unlocked.
    // In a production app, we would run a migration script.
    for (const v of vendors) {
      if (v.isAvailable === false) {
        v.isAvailable = true;
        await v.save();
      }
    }

    let formattedVendors = vendors.map(vendor => {
      const vendorObj = vendor.toObject();

      // Find the specific service details
      const serviceEntry = vendorObj.servicesProvided.find(
        (s) => s.serviceId.toString() === service._id.toString()
      );

      return {
        _id: vendorObj._id,
        companyName: vendorObj.companyName,
        location: vendorObj.location,
        phone: vendorObj.phone,
        user: vendorObj.user,
        trustScore: vendorObj.trustScore,
        minPrice: serviceEntry ? serviceEntry.minPrice : 0,
        maxPrice: serviceEntry ? serviceEntry.maxPrice : 0,
        isActive: serviceEntry ? serviceEntry.isActive !== false : false,
        isAvailable: vendorObj.isAvailable, // Pass global availability
        ratingAverage: vendorObj.ratingAverage || 0, // Include rating
        totalJobs: vendorObj.totalJobs || 0 // Include total jobs for rating context
      };
    });

    // 4️⃣ Sort Results
    if (sortBy) {
      formattedVendors.sort((a, b) => {
        switch (sortBy) {
          case "price_asc":
            return a.minPrice - b.minPrice;
          case "price_desc":
            return b.minPrice - a.minPrice;
          case "rating_desc":
            return b.ratingAverage - a.ratingAverage;
          case "name_asc":
            return a.companyName.localeCompare(b.companyName);
          case "name_desc":
            return b.companyName.localeCompare(a.companyName);
          default:
            return 0;
        }
      });
    } else {
      // Default sort by rating/trust
      formattedVendors.sort((a, b) => b.ratingAverage - a.ratingAverage);
    }

    res.json(formattedVendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET /api/vendors/me/services
export const getMyServices = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id })
      .populate("services");

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json(vendor.services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/vendors/me/services
export const addMyService = async (req, res) => {
  try {
    const { serviceId, minPrice, maxPrice } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!vendor.services.includes(serviceId)) {
      vendor.services.push(serviceId);
    }

    vendor.pricing = {
      ...vendor.pricing,
      [serviceId]: { minPrice, maxPrice },
    };

    await vendor.save();
    res.json(vendor.services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/vendors/availability
export const updateAvailability = async (req, res) => {
  try {
    const { available } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.available = available;
    await vendor.save();

    res.json({ available: vendor.available });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
