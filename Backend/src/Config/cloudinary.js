import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Ensure .env is loaded here (import order earlier prevented vars from being set before usage)
dotenv.config({ path: './.env' });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.Cloudinary_Api_Key; // fallback retained temporarily
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.Cloudinary_Api_Secret;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('[Cloudinary] Missing credentials. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set.');
}
console.log('[Cloudinary] Config snapshot:', { cloudName, apiKeyPresent: !!apiKey, apiSecretPresent: !!apiSecret });

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

export default cloudinary;