const usuarioService = require("../services/usuario.service");

class UsuarioController {
  async getAll(req, res) {
    const usuarios = await usuarioService.getAll();
    res.json(usuarios);
  }

  async create(req, res) {
    const usuario = await usuarioService.create(req.body);
    res.status(201).json(usuario);
  }
}

module.exports = new UsuarioController();
