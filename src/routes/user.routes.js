import express from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Middleware para permitir que un usuario se modifique a sí mismo o que un ROOT/ADMIN lo modifique
const authorizeSelfOrAdmin = (req, res, next) => {
  try {
    if (req.user.role === "ROOT" || req.user.role === "ADMIN" || req.user.userId === req.params.id) {
      return next();
    }
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: "Acceso denegado. No tienes permisos para modificar este usuario.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error interno del servidor en la autorización.",
    });
  }
};

router.get("/users", authMiddleware, authorizeRoles("ROOT", "ADMIN", "USER"), getUsers);
router.post("/users", authMiddleware, authorizeRoles("ROOT", "ADMIN"), createUser);
router.put("/users/:id", authMiddleware, authorizeRoles("ROOT", "ADMIN"), updateUser);
router.delete("/users/:id", authMiddleware, authorizeRoles("ROOT", "ADMIN"), deleteUser);

/*
//se pueden comentar para no tener que logearse para probar las rutas
router.get("/users", authMiddleware, authorizeRoles('ROOT', 'ADMIN'), getUsers);
router.post("/users", createUser);
router.put("/users/:id", authMiddleware, authorizeSelfOrAdmin, updateUser);
router.delete("/users/:id", authMiddleware, authorizeRoles("ROOT", "ADMIN"), deleteUser);
*/

export default router;
