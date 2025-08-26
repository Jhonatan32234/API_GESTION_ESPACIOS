const reportedanoservice = require("../services/reporte_dano.service");

class ReporteDanoController {

  async insertarReporte(req, res) {
    const { usuario_id, inventario_id, descripcion } = req.body;
    const result = await reportedanoservice.insertarReporte(usuario_id, inventario_id, descripcion);
    res.status(201).json({ mensaje: "Reporte insertado correctamente", result });
  }

  async getPendientesEnProceso(req, res) {
    const result = await reportedanoservice.getPendientesEnProceso();
    res.json(result);
  }

  async getReparados(req, res) {
    const result = await reportedanoservice.getReparados();
    res.json(result);
  }

  async getPorUsuario(req, res) {
    const usuario_id = parseInt(req.params.id, 10);
    const result = await reportedanoservice.getPorUsuario(usuario_id);
    res.json(result);
  }
}

module.exports = new ReporteDanoController();
