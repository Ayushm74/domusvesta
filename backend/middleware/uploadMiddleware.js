import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "domusvesta",
    resource_type: "auto",
  }),
});

export const upload = multer({ storage });

