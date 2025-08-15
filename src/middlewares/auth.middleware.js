const { verificarToken } = require("../utils/jwt");

const authMiddleware = (rolesPermitidos = []) => {
  return (req, res, next) => {
    try {
      const token = req.cookies?.token; // Token HttpOnly

      if (!token) {
        return res.status(401).json({ mensaje: "No autorizado, token no encontrado" });
      }

      const payload = verificarToken(token);

      if (rolesPermitidos.length && !rolesPermitidos.includes(payload.rol)) {
        return res.status(403).json({ mensaje: "No tienes permiso para acceder" });
      }

      req.usuario = payload;
      next();
    } catch (error) {
      return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }
  };
};

module.exports = authMiddleware;
