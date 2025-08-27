const notificacionService = require("../services/notificacion.service");

class NotificacionController {
  async getByUsuario(req, res) {
    const usuario_id = parseInt(req.params.usuario_id);
    if (isNaN(usuario_id)) return res.status(400).json({ mensaje: "ID inválido" });

    const items = await notificacionService.getByUsuario(usuario_id);
    res.json(items);
  }

  async create(req, res) {
    try {
      const item = await notificacionService.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async marcarLeida(req, res) {
    const notificacion_id = parseInt(req.params.id);
    if (isNaN(notificacion_id)) return res.status(400).json({ mensaje: "ID inválido" });

    const result = await notificacionService.marcarLeida(notificacion_id);
    res.json(result);
  }

  async delete(req, res) {
    const notificacion_id = parseInt(req.params.id);
    if (isNaN(notificacion_id)) return res.status(400).json({ mensaje: "ID inválido" });

    const ok = await notificacionService.delete(notificacion_id);
    res.status(ok ? 204 : 404).send();
  }

async getNoLeidas(req, res) {
    const usuario_id = parseInt(req.params.usuario_id);
    const items = await notificacionService.getNoLeidasByUsuario(usuario_id);
    res.json(items);
  }  
}

module.exports = new NotificacionController();
