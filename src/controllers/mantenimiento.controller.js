const mantenimientoService = require("../services/mantenimiento.service");

class MantenimientoController {
  async insertarMantenimiento(req, res) {
    const { usuario_mantenimiento_id, reporte_id, tipo, fecha_programada, descripcion } = req.body;
    const result = await mantenimientoService.insertarMantenimiento(
      usuario_mantenimiento_id, reporte_id, tipo, fecha_programada, descripcion
    );
    res.status(201).json({ mensaje: "Mantenimiento insertado correctamente", result });
  }

  async completarMantenimiento(req, res) {
    const { mantenimiento_id, fecha_completado, costo } = req.body;
    const result = await mantenimientoService.completarMantenimiento(
      mantenimiento_id, fecha_completado, costo
    );
    res.status(200).json({ mensaje: "Mantenimiento completado correctamente", result });
  }
}

module.exports = new MantenimientoController();
