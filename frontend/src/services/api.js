const BASE_URL = "http://localhost:7000";

/**
 * Realiza una petición HTTP al backend midiendo el tiempo de respuesta
 * y capturando todos los detalles para la consola de depuración.
 */
export const requestAPI = async (method, path, body = null, token = null) => {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  const startTime = performance.now();

  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    return {
      success: response.ok,
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      data,
      duration,
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    return {
      success: false,
      url,
      method,
      status: 0,
      statusText: "Connection Error",
      data: {
        message: "No se pudo conectar con el servidor. ¿Está el backend corriendo en el puerto 7000?",
        error: error.message,
      },
      duration,
    };
  }
};
