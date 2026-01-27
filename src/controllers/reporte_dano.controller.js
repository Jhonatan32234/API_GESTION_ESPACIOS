const reportedanoservice = require("../services/reporte_dano.service");

class ReporteDanoController {

  async insertarReporte(req, res) {
    const { usuario_id, inventario_id, descripcion } = req.body;
    try {
      const result = await reportedanoservice.insertarReporte(usuario_id, inventario_id, descripcion);

      if (result.success === false) {
        return res.status(400).json({ mensaje: result.message });
      }

      res.status(201).json({ mensaje: "Reporte insertado correctamente", result });

    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error al insertar el reporte", error: error.message });
    }
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

  async rechazarReporte(req, res) {
    try {
      const { reporteId } = req.params;

      const result = await reportedanoservice.rechazarReporte(reporteId);

      res.status(200).json({
        mensaje: `Reporte de daño con ID ${reporteId} rechazado correctamente`,
        result
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error al rechazar el reporte", error: error.message });
    }
  }

  async actualizarReporte(req, res) {
  try {
    const { reporteId } = req.params;
    const data = req.body;

    const result = await reportedanoservice.actualizarReporte(reporteId, data);

    if (result.success === false) {
      return res.status(400).json({ mensaje: result.message });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el reporte", error: error.message });
  }
}

async marcarEnProceso(req, res) {
  try {
    const { reporteId } = req.params;
    const result = await reportedanoservice.marcarEnProceso(reporteId);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al marcar en proceso", error: error.message });
  }
}


async marcarReparado(req, res) {
  try {
    const { reporteId } = req.params;
    const result = await reportedanoservice.marcarReparado(reporteId);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al marcar reparado", error: error.message });
  }
}
}

module.exports = new ReporteDanoController();
