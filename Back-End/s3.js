import dotenv from 'dotenv';
import aws from 'aws-sdk';
import crypto from 'crypto';
import { promisify } from 'util';
const randomBytes = promisify(crypto.randomBytes);

dotenv.config();

const region = 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Initialize the S3 client with credentials
const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: 'v4',
});

// Function to generate a unique image name
async function generateImageName() {
  const rawBytes = await randomBytes(16);
  return rawBytes.toString('hex');
}

// Function to generate a signed URL for uploading to a specified bucket
export async function generateUploadURL(bucketName) {
  try {
    const imageName = await generateImageName();
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Expires: 60, // URL expiration time in seconds
    };

    const uploadURL = await s3.getSignedUrlPromise('putObject', params);
    return uploadURL;
  } catch (error) {
    console.error('Error generating S3 URL:', error);
    throw new Error('Failed to generate S3 URL');
  }
}

// Example usage of the generateUploadURL function with different buckets
export async function generateUploadURLForResize() {
  return await generateUploadURL('probucket36');
}

export async function generateUploadURLForGrayscale() {
  return await generateUploadURL('greyscalebucket');
}

export async function generateUploadURLForCrop() {
  return await generateUploadURL('cropbucket');
}

export async function generateUploadURLForPdf() {
  return await generateUploadURL('imgtopdfbucket');
}
