import { strapi } from "@strapi/client"

const client = strapi({
  baseURL: process.env.SERVERURL+'/api', // adjust to your API URL
  auth: process.env.SERVERJWTTOKEN,          // needs permission to upload files
});

export async function uploadQRCodeWithClient(
  qrCodeImage: string,
  userId: number
): Promise<any | null> {
  try {
    if (!qrCodeImage) {
      console.error('QR code image is empty');
      return null;
    }

    // Validate and extract base64 data
    const base64Match = qrCodeImage.match(/^data:image\/(png|jpg|jpeg);base64,/);
    if (!base64Match) {
      console.error('Invalid QR code data URL format');
      return null;
    }

    const base64Data = qrCodeImage.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const imageType = base64Match[1] || 'png';
    const fileName = `qr_code_${userId}.${imageType}`;
    const mimeType = `image/${imageType}`;

    console.log(`Attempting to upload QR code for user ${userId} via Strapi Client...`);

    // Upload using Buffer variant (filename + mimetype are required) [[Client upload](https://docs.strapi.io/cms/api/client#upload)]
    const result = await client.files.upload(buffer, {
      filename: fileName,
      mimetype: mimeType,
      fileInfo: {
        name: `QR Code for User ${userId}`,
        alternativeText: `Affiliate referral QR code for user ${userId}`,
        caption: 'Automatically generated affiliate QR code',
      },
    });

    // The response is an array of file objects [[Client upload](https://docs.strapi.io/cms/api/client#upload)]
    if (Array.isArray(result) && result.length > 0) {
      console.log(`✅ QR code uploaded successfully: ${result[0].url}`);
      return result[0];
    }

    console.error('Upload returned no files');
    return null;
  } catch (error) {
    console.error('❌ Error uploading QR code via Strapi Client:', error);
    return null;
  }
}
