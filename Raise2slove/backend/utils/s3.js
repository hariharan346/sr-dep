import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Initialize S3 Client only if credentials/region are available
const s3 = new S3Client({ 
  region: process.env.AWS_REGION || "us-east-1" 
});

/**
 * Uploads a multer-uploaded file to S3 if configured, else returns local path.
 * 
 * @param {Object} file Multer file object
 * @param {string} subFolder Folder name inside bucket (e.g. 'categories', 'services')
 * @returns {Promise<string>} File accessibility URL
 */
export const getImageUrl = async (file, subFolder) => {
  if (!file) return null;
  
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    // Local fallback path
    return `/uploads/${subFolder}/${file.filename}`;
  }

  const filePath = file.path;
  const fileKey = `${subFolder}/${file.filename}`;

  try {
    const fileStream = fs.createReadStream(filePath);
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileStream,
      ContentType: file.mimetype
    }));

    // Safely delete local file from disk after uploading
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkErr) {
      console.warn("Could not delete local temp file:", unlinkErr);
    }

    return `https://${bucketName}.s3.amazonaws.com/${fileKey}`;
  } catch (error) {
    console.error("Failed S3 upload, falling back to local path:", error);
    // Fallback to local server path
    return `/uploads/${subFolder}/${file.filename}`;
  }
};
