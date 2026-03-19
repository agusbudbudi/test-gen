import { put } from '@vercel/blob';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

/**
 * Uploads a local file to Vercel Blob.
 * 
 * @param {string} localFilePath - Full path to the local file.
 * @param {string} blobPath - Desired path in Vercel Blob (e.g., 'allure-results/filename.png').
 * @returns {Promise<string|null>} - The URL of the uploaded blob, or null if failed.
 */
export async function uploadToBlob(localFilePath, blobPath) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('BLOB_READ_WRITE_TOKEN is not set. Skipping blob upload.');
      return null;
    }

    if (!fs.existsSync(localFilePath)) {
      console.warn(`File not found: ${localFilePath}`);
      return null;
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const { url } = await put(blobPath, fileBuffer, {
      access: 'public', // Set to public (requires Vercel store to allow public access)
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log(`Successfully uploaded to Vercel Blob: ${url}`);
    return url;
  } catch (error) {
    console.error(`Failed to upload ${localFilePath} to Vercel Blob:`, error);
    return null;
  }
}
