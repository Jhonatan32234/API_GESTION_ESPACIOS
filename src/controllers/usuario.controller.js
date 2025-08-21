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

  async create(req, res) {
    const usuario = await usuarioService.create(req.body);
    res.status(201).json(usuario);
  }

  async update(req, res) {
    const usuario = await usuarioService.update(req.params.id, req.body);
    res.json(usuario);
  }

  async delete(req, res) {
    await usuarioService.delete(req.params.id);
    res.status(204).send();
  }

  async login(req, res) {
  const { email, contrasena } = req.body;
  const usuario = await usuarioService.login(email, contrasena);

  if (!usuario) {
    return res.status(401).json({ mensaje: "Credenciales incorrectas" });
  }

  const token = generarToken({ id: usuario.usuario_id, rol: usuario.rol });

  // Guardar token en cookie HTTPOnly
  res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "strict" });

  // Guardar rol en cookie separada (no HTTPOnly para que sea accesible desde cliente si es necesario)
  res.cookie("rol", usuario.rol, { httpOnly: false, secure: false, sameSite: "strict" });

  res.json({
    mensaje: "Login exitoso",
    usuario
  });
}


}

module.exports = new UsuarioController();
