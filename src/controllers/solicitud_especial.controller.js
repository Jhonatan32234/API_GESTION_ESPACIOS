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
  
  async obtenerHorarioPorEspacio(req, res) {
    try {
      const { espacio_id } = req.params;
      
      let horario;
      horario = await solicitudEspecialService.obtenerHorarioPorEspacio(espacio_id);
      
      res.json(horario);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async aprobar(req, res) {
  try {
    const { solicitud_especial_id } = req.params;
    
    if (!solicitud_especial_id) {
      return res.status(400).json({ mensaje: "ID de solicitud especial requerido" });
    }

    await solicitudEspecialService.aprobarSolicitudEspecial(solicitud_especial_id);
    
    res.json({
      mensaje: "Solicitud especial aprobada con éxito. El espacio ha sido reservado y los afectados notificados."
    });

  } catch (error) {
    // Manejo de errores específicos
    if (error.message === "LA_SOLICITUD_NO_EXISTE") {
        return res.status(404).json({ mensaje: "La solicitud especial no existe en el sistema." });
    }
    if (error.message === "LA_SOLICITUD_YA_ESTA_APROBADA") {
        return res.status(400).json({ mensaje: "Esta solicitud ya fue aprobada anteriormente." });
    }

    res.status(500).json({ 
        mensaje: "Error interno al procesar la aprobación", 
        error: error.message 
    });
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
    res.status(500).json({ mensaje: error.message || "Error obteniendo solicitudes especiales del usuario" });
  }
}


async getAll(req, res) {
  try {
    const data = await solicitudEspecialService.getSolicitudesEspeciales();
   
    if (data.length === 0) {
      return res.json([]);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      mensaje: "Error al obtener solicitudes especiales", 
      error: error.message,
    });
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
