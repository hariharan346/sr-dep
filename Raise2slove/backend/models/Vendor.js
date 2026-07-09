import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    servicesProvided: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        minPrice: {
          type: Number,
          required: true,
        },
        maxPrice: {
          type: Number,
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    location: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptedJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelledJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgResponseTime: { // in hours
      type: Number,
      default: 0,
      min: 0,
    },
    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
