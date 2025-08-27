const mantenimientoService = require("../services/mantenimiento.service");

class MantenimientoController {
  async insertarMantenimiento(req, res) {
    const { usuario_id, reporte_id, tipo, fecha_programada, descripcion } = req.body;
    if (!usuario_id || !reporte_id || !tipo || !fecha_programada || !descripcion) {
        return res.status(400).json({ mensaje: "Faltan datos obligatorios para insertar mantenimiento" });
    }
    try {
        const result = await mantenimientoService.insertarMantenimiento(
            usuario_id,
            reporte_id,
            tipo,
            fecha_programada,
            descripcion
        );
        res.status(201).json({ mensaje: "Mantenimiento insertado correctamente", result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al insertar mantenimiento", error: error.message });
    }
}

   async cancelarMantenimiento(req, res) {
  try {
    const mantenimiento_id = parseInt(req.params.mantenimiento_id, 10);

    if (!mantenimiento_id) {
      return res.status(400).json({ mensaje: "Falta el ID del mantenimiento para cancelar" });
    }

    const result = await mantenimientoService.cancelarMantenimiento(mantenimiento_id);

    res.status(200).json({
      mensaje: `Mantenimiento con ID ${mantenimiento_id} cancelado correctamente`,
      result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cancelar el mantenimiento", error: error.message });
  }
}


  async completarMantenimiento(req, res) {
    try {
      const { mantenimiento_id, fecha_completado, costo } = req.body;

      if (!mantenimiento_id || !fecha_completado || costo === undefined) {
        return res.status(400).json({ mensaje: "Faltan datos obligatorios para completar mantenimiento" });
      }

      const result = await mantenimientoService.completarMantenimiento(
        mantenimiento_id,
        fecha_completado,
        costo
      );

      res.status(200).json({
        mensaje: `Mantenimiento con ID ${mantenimiento_id} completado correctamente`,
        result
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error al completar el mantenimiento", error: error.message });
    }
  }

  async getPendientesEnProceso(req, res) {
    const result = await mantenimientoService.getPendientesEnProceso();
    res.json(result);
  }

  async getCompletados(req, res) {
    const result = await mantenimientoService.getCompletados();
    res.json(result);
  }

  async getPorUsuario(req, res) {
    const { usuarioId } = req.params;
    const result = await mantenimientoService.getPorUsuario(usuarioId);
    res.json(result);
  }
}

module.exports = new MantenimientoController();
