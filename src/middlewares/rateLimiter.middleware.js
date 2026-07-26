import rateLimit from "express-rate-limit";
import { errorResponse } from "../helpers/response.helper.js";
import SecurityLog from "../models/securityLog.model.js";

const windowMinutes = Number(process.env.RATELIMIT_WINDOW_MINUTES) || 15;
const maxRequests = Number(process.env.RATELIMIT_MAX_REQUESTS) || 100;

const rateLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Demasiadas Solicitudes. Intente nuevamente en unos minutos.",
    errors: null,
  },
  handler: async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknow";
    await SecurityLog.create({
      eventType: "rate_limit",
      ip,
      method: req.method,
      path: req.originalUrl,
      userAgent: req.get("user-agent") || "",
      userEmail: req.body?.email || "",
      details: {
        reason: "Rate limiting exceeded",
      },
    });
    errorResponse(res, "Demasiadas Solicitudes. Intente nuevamente en unos minutos.", 429, null);
  },
});

export { rateLimiter };
