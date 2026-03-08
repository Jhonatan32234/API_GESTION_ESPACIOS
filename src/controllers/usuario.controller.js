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
      // Enviamos el mensaje que definimos en el Service ("No puedes desactivar tu propia cuenta", etc.)
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

  // Guardar token en cookie HTTPOnly
  res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "strict" });

  res.cookie("id", usuario.usuario_id, { httpOnly: false, secure: false, sameSite: "strict" });
  // Guardar rol en cookie separada (no HTTPOnly para que sea accesible desde cliente si es necesario)
  res.cookie("rol", usuario.rol, { httpOnly: false, secure: false, sameSite: "strict" });

  res.json({
    mensaje: "Login exitoso",
    usuario
  });
} catch (error) {
  res.status(403).json({ mensaje: error.message });
}
}

 async logout(req, res) {
    // Borrar cookies estableciendo valor vacío y expiración pasada
    res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "strict" });
    res.clearCookie("id", { httpOnly: false, secure: false, sameSite: "strict" });
    res.clearCookie("rol", { httpOnly: false, secure: false, sameSite: "strict" });

    res.json({ mensaje: "Logout exitoso" });
  }
}

module.exports = new UsuarioController();
