import aws from 'aws-sdk';
import sharp from 'sharp';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import dotenv from 'dotenv';
import { promisify } from 'util';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';

dotenv.config();

const randomBytes = promisify(crypto.randomBytes);

const s3 = new aws.S3({
  region: 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
});

const bucketName = 'imgtopdfbucket';

async function generateFileName() {
  const rawBytes = await randomBytes(16);
  return rawBytes.toString('hex');
}

export async function convertToPDF(imageUrls) {
  try {
    const pdfFileName = await generateFileName();
    const tempDir = os.tmpdir();
    const pdfPath = `${tempDir}/${pdfFileName}.pdf`;

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    for (const imageUrl of imageUrls) {
      const response = await axios({ url: imageUrl, method: 'GET', responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      const metadata = await sharp(imageBuffer).metadata();

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      const scale = Math.min(pageWidth / metadata.width, pageHeight / metadata.height);
      const imgWidth = metadata.width * scale;
      const imgHeight = metadata.height * scale;

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      doc.image(imageBuffer, x, y, { width: imgWidth, height: imgHeight });
      doc.addPage();
    }

    doc.end();
    await new Promise((resolve) => writeStream.on('finish', resolve));

    const pdfBuffer = fs.readFileSync(pdfPath);
    const uploadParams = { Bucket: bucketName, Key: `pdf/${pdfFileName}.pdf`, Body: pdfBuffer, ContentType: 'application/pdf' };
    const uploadResult = await s3.upload(uploadParams).promise();
    fs.unlinkSync(pdfPath);

    return uploadResult.Location;
  } catch (error) {
    console.error('Error converting images to PDF:', error);
    throw new Error('Failed to convert and upload PDF');
  }
}
