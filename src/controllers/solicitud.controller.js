const solicitudService = require("../services/solicitud.service");

class SolicitudController {

  async insertarSolicitudNormal(req, res) {
    try {
      await solicitudService.insertarSolicitudNormal(req.body);
      res.status(201).json({ mensaje: "Solicitud insertada correctamente" });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }

  async aprobarSolicitud(req, res) {
    try {
      const solicitud_id = parseInt(req.params.id);
      await solicitudService.aprobarSolicitud(solicitud_id);
      res.status(200).json({ mensaje: "Solicitud aprobada correctamente" });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }

  async getCalendario(req, res) {
    try {
      const { periodo_id } = req.query;
      const calendario = await solicitudService.getCalendarioPorPeriodo(periodo_id);
      res.json(calendario);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: error.message || "Error obteniendo el calendario" });
    }
  }

  async getSolicitudesPorSemana(req, res) {
  try {
    const { periodo_id, mes, anio } = req.query;
    if (!periodo_id || !mes || !anio) {
      return res.status(400).json({ error: "Debe especificar periodo_id, mes y anio" });
    }

    const semanal = await solicitudService.getSolicitudesPorSemana(periodo_id, mes, anio);
    res.json(semanal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message || "Error obteniendo solicitudes semanales" });
  }
}

}

module.exports = new SolicitudController();
