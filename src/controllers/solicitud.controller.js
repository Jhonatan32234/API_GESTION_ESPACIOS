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
    const solicitud_id = parseInt(req.params.solicitud_id);
    const usuario_id = parseInt(req.params.usuario_id);

    await solicitudService.aprobarSolicitud(solicitud_id, usuario_id);

    res.status(200).json({ mensaje: "Solicitud aprobada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
}

async rechazarNormal(req, res) {
    const { id } = req.params;

    try {
      await solicitudService.rechazarSolicitudNormal(id);
      res.json({ mensaje: `Solicitud con ID ${id} rechazada exitosamente.` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error al rechazar la solicitud." });
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

async getSolicitudes(req, res) {
    try {
      const solicitudes = await solicitudService.getSolicitudes();
      res.json(solicitudes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: error.message || "Error obteniendo solicitudes aprobadas" });
    }
  }

  async getSolicitudesPendRech(req, res) {
    try {
      const solicitudes = await solicitudService.getSolicitudesPendRech();
      res.json(solicitudes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: error.message || "Error obteniendo solicitudes pendientes/rechazadas" });
    }
  }
  
}

module.exports = new SolicitudController();
