import aws from 'aws-sdk';
import sharp from 'sharp';
import axios from 'axios';
import dotenv from 'dotenv';
import { promisify } from 'util';
import crypto from 'crypto';

dotenv.config();

const randomBytes = promisify(crypto.randomBytes);

const s3 = new aws.S3({
  region: 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
});

const bucketName = 'probucket36';

// Function to generate a unique file name
async function generateFileName() {
  const rawBytes = await randomBytes(16);
  return rawBytes.toString('hex');
}

// Function to resize and upload the image
export async function resizeAndUploadImage(imageUrl) {
  try {
    // Download the original image
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });
    const originalImageBuffer = Buffer.from(response.data);

    // Resize the image
    const resizedImageBuffer = await sharp(originalImageBuffer)
      .resize({ width: 500 }) // Resize to a width of 500px (adjust as needed)
      .toBuffer();

    // Generate a new file name for the resized image
    const resizedFileName = await generateFileName();

    // Upload the resized image to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: `resized/${resizedFileName}.jpg`, // Store in a 'resized' folder
      Body: resizedImageBuffer,
      ContentType: 'image/jpeg',
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    return uploadResult.Location; // Return the URL of the resized image
  } catch (error) {
    console.error("Error resizing and uploading image:", error);
    throw new Error("Failed to resize and upload image");
  }
}
