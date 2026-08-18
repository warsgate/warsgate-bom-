import { google } from 'googleapis';
import fs from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const getAuth = () => {
  try {
    const credentialsStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsStr) return null;
    
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
  filePath: string,
  fileName: string,
  mimeType: string,
  folderId: string = '1ibU9OCGBz9_k_Fy2_y62p-iMSNYXGxe3'
) => {
  const auth = getAuth();
  if (!auth) {
    throw new Error('Google Drive authentication not configured. Please set GOOGLE_APPLICATION_CREDENTIALS_JSON in .env');
  }

  const drive = google.drive({ version: 'v3', auth });
  
  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    
    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  } finally {
    // Clean up local temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};
