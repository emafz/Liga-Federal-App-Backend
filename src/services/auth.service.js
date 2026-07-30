import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { env } from "../config/env.js";

const loginService = async (data) => {
  try {
    const user = await User.findOne({
      email: data.email,
    });
    if (!user) {
      throw {
        statusCode: 404,
        message: "Usuario no encontrado",
      };
    }
    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      throw {
        statusCode: 401,
        message: "Password incorrecto",
      };
    }
    // Actualizar fecha y hora del último login
    user.ultimoLogin = new Date();
    await user.save();
    // Payload del token
    const payload = {
      userId: user._id,
      role: user.role,
    };
    // Generación del JWT
    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
    return {
      token,
      role: user.role,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        alias: user.alias,
        email: user.email,
        fechaNacimiento: user.fechaNacimiento,
        edad: user.edad,
        genero: user.genero,
        telefono: user.telefono,
        direccion: user.direccion,
        localidad: user.localidad,
        provincia: user.provincia,
        pais: user.pais,
        codigoPostal: user.codigoPostal,
        avatar: user.avatar,
        tarjeta: user.tarjeta,
        poder: user.poder,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("❌ Error en loginService:", error);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || "Error interno del servidor",
      errors: error.errors || null,
    };
  }
};

export { loginService };
