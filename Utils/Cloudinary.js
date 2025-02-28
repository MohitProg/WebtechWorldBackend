import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// cloudinary.config({
//     cloud_name:process.env.CLOUD_NAME,
//     api_key:process.env.API_KEY,
//     api_secret:process.env.API_SECRET
// });

cloudinary.config({
  cloud_name: "dmd35imtv",
  api_key: "424113654613344",
  api_secret: "QNgrda51__CmmPxvCX-315R7cU0", // Click 'View Credentials' below to copy your API secret
});
const UploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;

    // Upload an image
    const uploadResult = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
      
    });
    fs.unlinkSync(localfilepath);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localfilepath);
    return null;
  }
};

export { UploadOnCloudinary };
