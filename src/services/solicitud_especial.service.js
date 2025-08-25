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

  async aprobarSolicitudEspecial(solicitud_especial_id) {
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
      WHERE se.estado = 'aprobada'
      ORDER BY se.fecha DESC;
    `);
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
