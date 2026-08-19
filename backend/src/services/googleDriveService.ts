export const uploadToGoogleDrive = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string = '1ibU9OCGBz9_k_Fy2_y62p-iMSNYXGxe3'
) => {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxph31DQf5Sw2qsLsTWAbz6dFraJ0dIRmyCdyO1_FvfpgljwW5cIiSZ3B31J29-zbo/exec';

  try {
    const fileData = buffer.toString('base64');
    
    // We must send data as x-www-form-urlencoded or multipart/form-data for Apps Script doPost
    const formData = new URLSearchParams();
    formData.append('fileName', fileName);
    formData.append('mimeType', mimeType);
    formData.append('fileData', fileData);

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Apps Script responded with status: ${response.status}`);
    }

    const result: any = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown error from Apps Script');
    }

    return {
      id: result.fileId,
      webViewLink: result.fileUrl
    };
  } catch (error: any) {
    console.error('Error uploading via Apps Script:', error);
    throw new Error(`Upload Failed: ${error.message}`);
  }
};
