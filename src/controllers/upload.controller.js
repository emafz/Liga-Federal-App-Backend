import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// -------------------------------------------------------
// Helper: convierte un Buffer en un stream legible y lo
// sube a Cloudinary en la carpeta indicada.
// Devuelve: { url, public_id }
// -------------------------------------------------------
async function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,                      // ej: "Liga_Federal/Avatar"
        resource_type: "image",
        overwrite: true,
        transformation: [
          { quality: "auto:good" },  // compresión automática sin pérdida visible
          { fetch_format: "auto" },  // formato óptimo (WebP, AVIF, etc.)
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );

    // Convertir el Buffer de multer en un Readable stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// -------------------------------------------------------
// POST /upload/avatar
// Sube la imagen a Liga_Federal/Avatar y devuelve la URL
// -------------------------------------------------------
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo de imagen",
      });
    }

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "Liga_Federal/Avatar"
    );

    return res.status(200).json({
      success: true,
      message: "Avatar subido correctamente",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error al subir avatar a Cloudinary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al subir la imagen",
    });
  }
};

// -------------------------------------------------------
// POST /upload/tarjeta
// Sube la imagen a Liga_Federal/Tarjetas y devuelve la URL
// -------------------------------------------------------
export const uploadTarjeta = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo de imagen",
      });
    }

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "Liga_Federal/Tarjetas"
    );

    return res.status(200).json({
      success: true,
      message: "Tarjeta subida correctamente",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error al subir tarjeta a Cloudinary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al subir la imagen",
    });
  }
};
