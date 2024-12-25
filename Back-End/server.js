import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateUploadURLForResize, generateUploadURLForGrayscale, generateUploadURLForCrop, generateUploadURLForPdf } from './s3.js'; // Import the respective functions
import { resizeAndUploadImage } from './resize.js';
import { grayscaleAndUploadImage } from './greyscale.js';
import { cropAndUploadImage } from './crop.js';
import { convertToPDF } from './pdf.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://127.0.0.1:5500' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generate S3 URL for image resizing
app.get('/s3Url/resize', async (req, res) => {
  try {
    const url = await generateUploadURLForResize();
    res.json({ url });
  } catch (error) {
    console.error('Error generating S3 URL for resize:', error);
    res.status(500).json({ error: 'Failed to generate S3 URL for resize' });
  }
});

// Generate S3 URL for grayscale image
app.get('/s3Url/greyscale', async (req, res) => {
  try {
    const url = await generateUploadURLForGrayscale();
    res.json({ url });
  } catch (error) {
    console.error('Error generating S3 URL for grayscale:', error);
    res.status(500).json({ error: 'Failed to generate S3 URL for grayscale' });
  }
});

// Generate S3 URL for image crop
app.get('/s3Url/crop', async (req, res) => {
  try {
    const url = await generateUploadURLForCrop();
    res.json({ url });
  } catch (error) {
    console.error('Error generating S3 URL for crop:', error);
    res.status(500).json({ error: 'Failed to generate S3 URL for crop' });
  }
});

// Generate S3 URL for image-to-PDF conversion
app.get('/s3Url/pdf', async (req, res) => {
  try {
    const url = await generateUploadURLForPdf();
    res.json({ url });
  } catch (error) {
    console.error('Error generating S3 URL for PDF:', error);
    res.status(500).json({ error: 'Failed to generate S3 URL for PDF' });
  }
});

// Resizing endpoint
app.post('/resize', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }
  try {
    const resizedImageUrl = await resizeAndUploadImage(imageUrl);
    res.json({ resizedImageUrl });
  } catch (error) {
    console.error('Error resizing image:', error);
    res.status(500).json({ error: 'Failed to resize image' });
  }
});

// Grayscale endpoint
app.post('/greyscale', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }
  try {
    const grayscaleImageUrl = await grayscaleAndUploadImage(imageUrl);
    res.json({ grayscaleImageUrl });
  } catch (error) {
    console.error('Error processing grayscale image:', error);
    res.status(500).json({ error: 'Failed to process grayscale image' });
  }
});

// Cropping endpoint
app.post('/crop', async (req, res) => {
  const { imageUrl, width, height, x, y } = req.body;
  if (!imageUrl || !width || !height || !x || !y) {
    return res.status(400).json({ error: 'Image URL and crop parameters are required' });
  }
  try {
    const croppedImageUrl = await cropAndUploadImage(imageUrl, width, height, x, y);
    res.json({ croppedImageUrl });
  } catch (error) {
    console.error('Error cropping image:', error);
    res.status(500).json({ error: 'Failed to crop image' });
  }
});

// Image to PDF conversion endpoint
app.post('/pdf', async (req, res) => {
  const { imageUrls } = req.body;
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: 'Array of image URLs is required' });
  }
  try {
    const pdfUrl = await convertToPDF(imageUrls);
    res.json({ pdfUrl });
  } catch (error) {
    console.error('Error converting images to PDF:', error);
    res.status(500).json({ error: 'Failed to convert images to PDF' });
  }
});

// Serve frontend files
app.use(express.static('front', { extensions: ['html'] }));

// Start the server
app.listen(5501, () => console.log('Server running on http://127.0.0.1:5501'));
