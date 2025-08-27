const AppDataSource = require("../config/ormconfig");

class NotificacionService {
  // Obtener notificaciones de un usuario
  async getByUsuario(usuario_id) {
    const query = `
      SELECT notificacion_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
      FROM notificacion
      WHERE usuario_id = ?
      ORDER BY fecha_envio DESC
    `;
    return await AppDataSource.query(query, [usuario_id]);
  }

  async getNoLeidasByUsuario(usuario_id) {
    const query = `
      SELECT notificacion_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
      FROM notificacion
      WHERE usuario_id = ? AND leida = false
      ORDER BY fecha_envio DESC
    `;
    return await AppDataSource.query(query, [usuario_id]);
  }

  // Crear nueva notificación
  async create(data) {
    const query = `
      INSERT INTO notificacion
        (usuario_id, tipo, mensaje, leida, enviado, relacion_id, relacion_tipo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.usuario_id,
      data.tipo || "general",
      data.mensaje,
      data.leida || false,
      data.enviado || false,
      data.relacion_id || null,
      data.relacion_tipo || null
    ];
    const result = await AppDataSource.query(query, params);
    return { notificacion_id: result.insertId, ...data };
  }

  // Marcar notificación como leída
  async marcarLeida(notificacion_id) {
    const query = `UPDATE notificacion SET leida = true WHERE notificacion_id = ?`;
    await AppDataSource.query(query, [notificacion_id]);
    return { notificacion_id, leida: true };
  }

  // Eliminar notificación
  async delete(notificacion_id) {
    const query = `DELETE FROM notificacion WHERE notificacion_id = ?`;
    const result = await AppDataSource.query(query, [notificacion_id]);
    return result.affectedRows > 0;
  }
}

module.exports = new NotificacionService();
