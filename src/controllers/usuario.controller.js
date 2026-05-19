const usuarioService = require("../services/usuario.service"); // importa la instancia
const { generarToken } = require("../utils/jwt");

class UsuarioController {
  async getAll(req, res) {
    const usuarios = await usuarioService.getAll();
    res.json(usuarios);
  }

  async getById(req, res) {
    const usuario = await usuarioService.getById(req.params.id);
    usuario ? res.json(usuario) : res.status(404).json({ mensaje: "No encontrado" });
  }

  activarUsuario = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await usuarioService.activar(id);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Error al activar usuario: ${error.message}`
      });
    }
  };

  desactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const solicitorId = req.usuario.id;

    const result = await usuarioService.desactivar(id, solicitorId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message 
      });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

  async create(req, res) {
  try {
    const usuario = await usuarioService.create(req.body);
    res.status(201).json({
      success: true,
      data: usuario,
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    if (error.message === 'El email ya está registrado') {
      return res.status(400).json({
        success: false,
        error: 'El email ya está en uso',
        message: 'Por favor utiliza otro email'
      });
    }
    
    // Otros errores
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al crear el usuario'
    });
  }
}

  async registerFirstAdmin(req, res) {
    try {
      const usuario = await usuarioService.createFirstAdmin(req.body);
      res.status(201).json({
        success: true,
        data: usuario,
        message: 'Primer administrador creado exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'No se pudo realizar el registro especial'
      });
    }
  }

  async update(req, res) {
    try {
        const solicitorId = req.user.id;
        const usuario = await usuarioService.update(req.params.id, req.body, solicitorId);
        res.json(usuario);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
  }

  async delete(req, res) {
    await usuarioService.delete(req.params.id);
    res.status(204).send();
  }

  async login(req, res) {
  try {
    const { email, contrasena } = req.body;
    const usuario = await usuarioService.login(email, contrasena);

    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }

    const token = generarToken({ id: usuario.usuario_id, rol: usuario.rol });

    // Configuración base para producción (Cross-Origin)
    const cookieOptionsPublicas = {
      httpOnly: false, // 🚨 Fiel a tu código: accesible desde el cliente de React
      secure: true,    // 🚨 Obligatorio para entornos de producción HTTPS
      sameSite: "none",// 🚨 Obligatorio para que viajen entre dominios distintos (.cloud y .fun)
      maxAge: 24 * 60 * 60 * 1000 // 1 día (opcional, para que no venzan al cerrar el navegador)
    };

    const cookieOptionsPrivadas = {
      ...cookieOptionsPublicas,
      httpOnly: true   // 🚨 Fiel a tu código: Protegida contra XSS
    };

    // 1. Guardar token en cookie HTTPOnly (Para tus middlewares)
    res.cookie("token", token, cookieOptionsPrivadas);

    // 2. Guardar id en cookie separada (Accesible por tu frontend)
    res.cookie("id", usuario.usuario_id, cookieOptionsPublicas);

    // 3. Guardar rol en cookie separada (Accesible por tu frontend)
    res.cookie("rol", usuario.rol, cookieOptionsPublicas);

    // Mantenemos tu respuesta JSON intacta por si tu frontend la usa en algún lado
    return res.json({
      mensaje: "Login exitoso",
      usuario
    });

  } catch (error) {
    console.error("Error en login:", error.message);
    return res.status(403).json({ mensaje: error.message });
  }
}

  async logout(req, res) {
    const isProduction = process.env.NODE_ENV === "production";
    
    // ⚠️ Las opciones para borrar deben coincidir exactamente con las que se crearon
    const clearOptions = {
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax"
    };

    res.clearCookie("token", { ...clearOptions, httpOnly: true });
    res.clearCookie("id", { ...clearOptions, httpOnly: false });
    res.clearCookie("rol", { ...clearOptions, httpOnly: false });

    return res.json({ mensaje: "Logout exitoso" });
  }
}

module.exports = new UsuarioController();
