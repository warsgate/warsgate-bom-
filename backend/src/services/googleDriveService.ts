import { google } from 'googleapis';
import fs from 'fs';

import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const getAuth = () => {
  try {
    const credentialsStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsStr) return null;
    
    // Parse the JSON directly (Render passes the exact string provided)
    const credentials = JSON.parse(credentialsStr);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
  } catch (error) {
    console.error('Failed to parse Google Drive credentials:', error);
    return null;
  }
};

export const uploadToGoogleDrive = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string = '1ibU9OCGBz9_k_Fy2_y62p-iMSNYXGxe3'
) => {
  const auth = getAuth();
  if (!auth) {
    throw new Error('Google Drive authentication not configured or invalid JSON Key. Please check the GOOGLE_APPLICATION_CREDENTIALS_JSON setting.');
  }

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
