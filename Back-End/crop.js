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

const bucketName = 'cropbucket';

// Function to generate a unique file name
async function generateFileName() {
  const rawBytes = await randomBytes(16);
  return rawBytes.toString('hex');
}

// Function to crop an image and upload it
export async function cropAndUploadImage(imageUrl, cropOptions) {
  try {
    const { x, y, width, height } = cropOptions;

    // Download the original image
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });
    const originalImageBuffer = Buffer.from(response.data);

    // Crop the image
    const croppedImageBuffer = await sharp(originalImageBuffer)
      .extract({ left: x, top: y, width: width, height: height })
      .toBuffer();

    // Generate a new file name
    const croppedFileName = await generateFileName();

    // Upload the cropped image to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: `cropped/${croppedFileName}.jpg`,
      Body: croppedImageBuffer,
      ContentType: 'image/jpeg',
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    return uploadResult.Location; // Return the URL of the cropped image
  } catch (error) {
    console.error("Error cropping and uploading image:", error);
    throw new Error("Failed to crop and upload image");
  }
}
