import mongoose from "mongoose";
import dotenv from "dotenv";
import Vendor from "../models/Vendor.js";
import Service from "../models/Service.js";

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const inspectData = async () => {
    await connectDB();

    console.log("--- SERVICES ---");
    const services = await Service.find({});
    services.forEach(s => console.log(`${s.name} (slug: ${s.slug}) ID: ${s._id}`));

    console.log("\n--- VENDORS ---");
    const vendors = await Vendor.find({});
    vendors.forEach(v => {
        console.log(`Vendor: ${v.companyName} (ID: ${v._id}) Available: ${v.isAvailable}`);
        console.log("Services Provided:", JSON.stringify(v.servicesProvided, null, 2));
    });

    process.exit();
};

inspectData();
