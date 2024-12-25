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

const bucketName = 'greyscalebucket';

// Function to generate a unique file name
async function generateFileName() {
  const rawBytes = await randomBytes(16);
  return rawBytes.toString('hex');
}

// Function to convert an image to grayscale and upload it
export async function grayscaleAndUploadImage(imageUrl) {
  try {
    // Download the original image
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });
    const originalImageBuffer = Buffer.from(response.data);

    // Convert the image to grayscale
    const grayscaleImageBuffer = await sharp(originalImageBuffer)
      .grayscale()
      .toBuffer();

    // Generate a new file name
    const grayscaleFileName = await generateFileName();

    // Upload the grayscale image to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: `grayscale/${grayscaleFileName}.jpg`,
      Body: grayscaleImageBuffer,
      ContentType: 'image/jpeg',
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    return uploadResult.Location; // Return the URL of the grayscale image
  } catch (error) {
    console.error("Error converting image to grayscale:", error);
    throw new Error("Failed to convert and upload grayscale image");
  }
}
