import { google } from 'googleapis';
import fs from 'fs';

import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const getAuth = () => {
  const credentialsStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsStr) {
    throw new Error('Environment variable GOOGLE_APPLICATION_CREDENTIALS_JSON is completely empty or missing.');
  }
  
  try {
    const credentials = JSON.parse(credentialsStr);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
  } catch (error: any) {
    console.error('Failed to parse Google Drive credentials:', error);
    // Provide a detailed error message about WHY it failed to parse
    throw new Error(`JSON Format Error: ก๊อปปี้โค้ดมาไม่สมบูรณ์ หรือมีอักขระแปลกปลอม (${error.message})`);
  }
};

export const uploadToGoogleDrive = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string = '1ibU9OCGBz9_k_Fy2_y62p-iMSNYXGxe3'
) => {
  const auth = getAuth();

  const drive = google.drive({ version: 'v3', auth });
  
  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    
    const media = {
      mimeType,
      body: Readable.from(buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return response.data;
  } catch (error: any) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error(`Google Drive API Error: ${error.message}`);
  }
};
