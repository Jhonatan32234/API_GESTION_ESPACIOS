const solicitudEspecialService = require("../services/solicitud_especial.service");

class SolicitudEspecialController {
  async insertar(req, res) {
    try {
      const datos = req.body;
      const result = await solicitudEspecialService.insertarSolicitudEspecial(datos);
      res.status(201).json({
        mensaje: "Solicitud especial registrada",
        resultado: result
      });
    } catch (error) {
      res.status(500).json({ mensaje: "Error al insertar solicitud especial", error: error.message });
    }
  }
  
  async aprobar(req, res) {
  try {
    const { solicitud_especial_id } = req.params; // Cambiado para leer parámetro de ruta
    if (!solicitud_especial_id) {
      return res.status(400).json({ mensaje: "Solicitud especial id requerido" });
    }
    const emailsNotificados = await solicitudEspecialService.aprobarSolicitudEspecial(solicitud_especial_id);
    res.json({
      mensaje: "Solicitud especial aprobada, usuarios afectados notificados",
      emailsNotificados
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al aprobar solicitud especial", error: error.message });
  }
  }

  async rechazar(req, res) {
    try {
        const { solicitud_especial_id } = req.params;
        if (!solicitud_especial_id) {
            return res.status(400).json({ mensaje: "Solicitud especial id requerido" });
        }

        const result = await solicitudEspecialService.rechazarSolicitudEspecial(solicitud_especial_id);
        res.json({
            mensaje: "Solicitud especial rechazada y usuario notificado",
            resultado: result
        });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al rechazar solicitud especial", error: error.message });
    }
}

async getSolicitudesEspecialesPorUsuario(req, res) {
  try {
    const usuario_id = parseInt(req.params.usuario_id);
    const solicitudes = await solicitudEspecialService.getSolicitudesEspecialesPorUsuario(usuario_id);
    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message || "Error obteniendo solicitudes especiales del usuario" });
  }
}


  async listarAprobadas(req, res) {
    try {
      const data = await solicitudEspecialService.getSolicitudesEspeciales();
      res.json(data);
    } catch (error) {
      res.status(500).json({ mensaje: "Error al obtener solicitudes especiales aprobadas", error: error.message });
    }
  }

  async listarPendRech(req, res) {
    try {
      const data = await solicitudEspecialService.getSolicitudesEspecialesPendRech();
      res.json(data);
    } catch (error) {
      res.status(500).json({ mensaje: "Error al obtener solicitudes especiales pendientes/rechazadas", error: error.message });
    }
  }
}

module.exports = new SolicitudEspecialController();
