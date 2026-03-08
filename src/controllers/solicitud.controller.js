const solicitudService = require("../services/solicitud.service");

class SolicitudController {

  async insertarSolicitudNormal(req, res) {
  try {
    const nuevaSolicitud = await solicitudService.insertarSolicitudNormal(req.body);
    
    return res.status(201).json({ 
      success: true,
      mensaje: "Solicitud enviada correctamente. Se encuentra en estado pendiente.",
      solicitud_id: nuevaSolicitud.solicitud_id 
    });

  } catch (error) {
    console.error("Error en insertarSolicitudNormal:", error.message);

    // Manejo de errores personalizados lanzados desde SQL
    if (error.message.includes('CONF_ERR')) {
      return res.status(409).json({ 
        success: false, 
        error: "Conflicto de Horario",
        detalle: "El salón ya está reservado para ese horario. Por favor revisa el calendario." 
      });
    }

    if (error.message.includes('VAL_ERR')) {
      return res.status(400).json({ 
        success: false, 
        error: "Datos Inválidos",
        detalle: "La hora de finalización debe ser posterior a la de inicio." 
      });
    }

    // Error genérico del servidor
    res.status(500).json({ 
      success: false, 
      error: "Error interno",
      detalle: "No pudimos procesar tu solicitud en este momento." 
    });
  }
}

async getSolicitudesNormalesPorUsuario(req, res) {
  try {
    const usuario_id = parseInt(req.params.usuario_id);
    const solicitudes = await solicitudService.getSolicitudesNormalesPorUsuario(usuario_id);
    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message || "Error obteniendo solicitudes normales del usuario" });
  }
}

async obtenerHorarioEspacio(req, res) {
    try {
      const { espacio_id } = req.params;
      
      let horario;
      horario = await solicitudService.obtenerHorarioPorEspacio(espacio_id);
      res.json(horario);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }

async aprobarSolicitud(req, res) {
  try {
    const solicitud_id = parseInt(req.params.solicitud_id);
    const usuario_id = parseInt(req.params.usuario_id);

    const resultado = await solicitudService.aprobarSolicitud(solicitud_id, usuario_id);

    res.status(200).json({ 
      success: true,
      mensaje: "Solicitud aprobada y conflictos resueltos correctamente.",
      data: resultado 
    });
  } catch (error) {
    console.error("Error al aprobar:", error.message);

    // Si el error viene de nuestro SIGNAL SQLSTATE en MySQL
    if (error.message.includes('Error:') || error.message.includes('No se puede')) {
      return res.status(400).json({ 
        success: false, 
        error: error.message.replace('ER_SIGNAL_EXCEPTION: ', '') 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: "Ocurrió un error inesperado al procesar la aprobación." 
    });
  }
}

async rechazarNormal(req, res) {
    const { id } = req.params;

    try {
        const result = await solicitudService.rechazarSolicitudNormal(id);
        res.json({ 
            success: true,
            mensaje: `Solicitud con ID ${id} rechazada exitosamente.`,
            data: result 
        });
    } catch (error) {        
        if (error.message.includes('CONFLICTO_APROBADAS')) {
            return res.status(409).json({ 
                success: false,
                mensaje: error.message.split(': ')[1]
            });
        } else if (error.message.includes('SOLICITUD_NO_EXISTE')) {
            return res.status(404).json({ 
                success: false,
                mensaje: error.message.split(': ')[1]
            });
        } else if (error.message.includes('ERROR_BASE_DATOS')) {
            return res.status(500).json({ 
                success: false,
                mensaje: 'Error interno del servidor al procesar la solicitud.'
            });
        } else {
            return res.status(500).json({ 
                success: false,
                mensaje: "Error al rechazar la solicitud." 
            });
        }
    }
}


async getCalendario(req, res) {
  try {
    const { periodo_id, espacio_id } = req.query;
    
    if (!espacio_id) {
      return res.status(400).json({ mensaje: "El parámetro 'espacio_id' es requerido" });
    }
    
    const calendario = await solicitudService.getCalendarioPorPeriodo(espacio_id, periodo_id);
    res.json(calendario);
  } catch (error) {
    res.status(500).json({ mensaje: error.message || "Error obteniendo el calendario" });
  }
}

async getSolicitudesPorSemana(req, res) {
  try {
    const { mes, espacio_id } = req.query;
    
    if (!mes) {
      return res.status(400).json({ 
        error: "El parámetro 'mes' es requerido (1-12)" 
      });
    }

    const mesNumero = parseInt(mes);
    if (mesNumero < 1 || mesNumero > 12) {
      return res.status(400).json({ 
        error: "El mes debe ser un número entre 1 y 12" 
      });
    }

    const espacioIdNumero = espacio_id ? parseInt(espacio_id) : null;

    const semanal = await solicitudService.getSolicitudesPorSemana(mesNumero, espacioIdNumero);
    res.json(semanal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      mensaje: error.message || "Error obteniendo solicitudes semanales" 
    });
  }
}

async getConflictos(req, res) {
  try {
    const conflictos = await solicitudService.getSolicitudesConConflicto();
    res.json(conflictos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message || "Error obteniendo las solicitudes en conflicto" });
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

  async getAll(req, res) {
    try {
      const solicitudes = await solicitudService.getAll();
      res.json(solicitudes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: error.message || "Error obteniendo solicitudes pendientes/rechazadas" });
    }
  }
  
}

module.exports = new SolicitudController();
