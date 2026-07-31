import { v2 as cloudinary } from "cloudinary";

// La variable CLOUDINARY_URL tiene el formato:
// cloudinary://API_KEY:API_SECRET@CLOUD_NAME
// cloudinary SDK la parsea automáticamente desde process.env.CLOUDINARY_URL
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

export default cloudinary;
