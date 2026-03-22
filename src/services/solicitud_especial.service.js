const AppDataSource = require("../config/ormconfig");

class SolicitudEspecialService {

  async insertarSolicitudEspecial({
    usuario_id,
    espacio_id,
    fecha,
    motivo,
    cantidad_asistentes,
    hora_inicio,
    hora_fin
  }) {
    const result = await AppDataSource.query(
      `CALL insertar_solicitud_especial(?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, espacio_id, fecha, motivo, cantidad_asistentes, hora_inicio, hora_fin]
    );

    return result;
  }

async obtenerHorarioPorEspacio(espacio_id) {
  const periodoService = require("./periodo.service");
  const periodoActivo = await periodoService.getPeriodoActivo();
  
  if (!periodoActivo) {
    throw new Error("No hay un periodo activo configurado");
  }

  const query = `
    SELECT 
      se.solicitud_especial_id,
      DATE_FORMAT(se.fecha, '%Y-%m-%d') as fecha,
      TIME_FORMAT(se.hora_inicio, '%H:%i') as hora_inicio,
      TIME_FORMAT(se.hora_fin, '%H:%i') as hora_fin,
      se.motivo,
      u.nombre as solicitante,
      se.cantidad_asistentes
    FROM solicitud_especial se
    LEFT JOIN usuario u ON se.usuario_id = u.usuario_id
    WHERE se.espacio_id = ?
      AND se.estado = 'aprobada'
      AND se.fecha BETWEEN ? AND ?
    ORDER BY se.fecha, se.hora_inicio
  `;
  
  const resultados = await AppDataSource.query(query, [
    espacio_id,
    periodoActivo.fecha_inicio,
    periodoActivo.fecha_fin
  ]);

  // Agrupar por fecha
  const solicitudesPorFecha = {};
  
  resultados.forEach(solicitud => {
    const fecha = solicitud.fecha;
    
    if (!solicitudesPorFecha[fecha]) {
      solicitudesPorFecha[fecha] = [];
    }
    
    solicitudesPorFecha[fecha].push({
      id: solicitud.solicitud_especial_id,
      rango: `${solicitud.hora_inicio}-${solicitud.hora_fin}`,
      hora_inicio: solicitud.hora_inicio,
      hora_fin: solicitud.hora_fin,
      motivo: solicitud.motivo,
      solicitante: solicitud.solicitante,
      asistentes: solicitud.cantidad_asistentes,
      // Generar horas individuales para este rango
      horas_individuales: (() => {
        const horas = [];
        const inicio = new Date(`2000-01-01T${solicitud.hora_inicio}:00`);
        const fin = new Date(`2000-01-01T${solicitud.hora_fin}:00`);
        
        let horaActual = new Date(inicio);
        while (horaActual < fin) {
          horas.push(horaActual.toTimeString().slice(0, 5));
          horaActual.setHours(horaActual.getHours() + 1);
        }
        return horas;
      })()
    });
  });

  // Construir respuesta
  const respuesta = {
    espacio_id: parseInt(espacio_id),
    periodo_id: periodoActivo.periodo_id,
    fechas: {}
  };

  // Ordenar fechas y procesar
  Object.keys(solicitudesPorFecha).sort().forEach(fecha => {
    const solicitudesDelDia = solicitudesPorFecha[fecha];
    
    // Todas las horas ocupadas ese día (sin duplicados)
    const todasHoras = new Set();
    solicitudesDelDia.forEach(s => {
      s.horas_individuales.forEach(hora => todasHoras.add(hora));
    });
    
    respuesta.fechas[fecha] = {
      horas: Array.from(todasHoras).sort()
    };
  });

  return respuesta;
} 

  async aprobarSolicitudEspecial(solicitud_especial_id) {
    // 1. Validar si existe y su estado actual
    const solicitud = await AppDataSource.query(
        `SELECT estado FROM solicitud_especial WHERE solicitud_especial_id = ?`,
        [solicitud_especial_id]
    );

    if (solicitud.length === 0) {
        throw new Error("LA_SOLICITUD_NO_EXISTE");
    }

    if (solicitud[0].estado === 'aprobada') {
        throw new Error("LA_SOLICITUD_YA_ESTA_APROBADA");
    }
    
    if (solicitud[0].estado === 'rechazada') {
        throw new Error("NO_SE_PUEDE_APROBAR_UNA_SOLICITUD_RECHAZADA");
    }

    // 2. Si todo está bien, ejecutar el procedimiento
    const result = await AppDataSource.query(
        `CALL aprobar_solicitud_especial(?)`,
        [solicitud_especial_id]
    );

    return result;
}

async rechazarSolicitudEspecial(solicitud_especial_id) {
    const result = await AppDataSource.query(
        `CALL rechazar_solicitud_especial(?)`,
        [solicitud_especial_id]
    );
    return result;
}

async getSolicitudesEspecialesPorUsuario(usuario_id) {
  const result = await AppDataSource.query(`
    SELECT 
      se.solicitud_especial_id,
      se.usuario_id,
      u.nombre AS usuario,
      e.nombre AS espacio,
      se.fecha,
      se.hora_inicio,
      se.hora_fin,
      se.cantidad_asistentes,
      se.motivo,
      se.estado
    FROM solicitud_especial se
    LEFT JOIN usuario u ON u.usuario_id = se.usuario_id
    LEFT JOIN espacio e ON e.espacio_id = se.espacio_id
    WHERE se.usuario_id = ?
    ORDER BY se.fecha DESC
  `, [usuario_id]);

  return result;
}

async getSolicitudesEspeciales() {  
  try {
    
    const query = `
      SELECT 
        se.solicitud_especial_id,
        ub.ubicacion AS ubicacion,
        e.nombre AS espacio_nombre,
        se.fecha,
        se.hora_inicio,
        se.hora_fin,
        se.espacio_id,
        se.cantidad_asistentes,
        se.motivo,
        se.estado
      FROM solicitud_especial se
      LEFT JOIN usuario u ON u.usuario_id = se.usuario_id
      LEFT JOIN espacio e ON e.espacio_id = se.espacio_id
      LEFT JOIN ubicacion ub ON ub.ubicacion_id = e.ubicacion_id
      ORDER BY se.fecha DESC;
    `;
   ;
    const result = await AppDataSource.query(query);
  
    return result;
  } catch (error) {
    throw error;
  }
}

  async getSolicitudesEspecialesPendRech() {
    return await AppDataSource.query(`
      SELECT 
        se.solicitud_especial_id,
        u.nombre AS usuario,
        e.nombre AS espacio,
        ub.ubicacion AS ubicacion,
        se.fecha,
        se.hora_inicio,
        se.hora_fin,
        se.cantidad_asistentes,
        se.motivo,
        se.estado
      FROM solicitud_especial se
      LEFT JOIN usuario u ON u.usuario_id = se.usuario_id
      LEFT JOIN espacio e ON e.espacio_id = se.espacio_id
      LEFT JOIN ubicacion ub ON ub.ubicacion_id = e.ubicacion_id
      WHERE se.estado IN ('pendiente', 'rechazada')
      ORDER BY se.fecha DESC;
    `);
  }
}

module.exports = new SolicitudEspecialService();
