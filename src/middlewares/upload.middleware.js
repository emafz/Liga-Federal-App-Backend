import multer from "multer";

// Almacenamos el archivo en memoria (Buffer) para luego subirlo a Cloudinary
// sin necesidad de escribirlo en disco primero.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Solo permitir imágenes
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB máximo
  },
});
