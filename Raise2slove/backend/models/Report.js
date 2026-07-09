import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Action Taken"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
