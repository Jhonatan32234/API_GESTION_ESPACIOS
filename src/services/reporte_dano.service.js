const AppDataSource = require("../config/ormconfig");

class ReporteDanoService {

  async insertarReporte(usuario_id, inventario_id, descripcion) {
    const result = await AppDataSource.query(
      `CALL insertar_reporte_dano(?, ?, ?)`,
      [usuario_id, inventario_id, descripcion]
    );
    return result;
  }

  async getPendientesEnProceso() {
  return await AppDataSource.query(`
    SELECT r.reporte_id, r.descripcion, r.fecha_reporte, r.estado,
           u.usuario_id, u.nombre, u.apellido, u.apellido2
    FROM reporte_dano r
    JOIN usuario u ON r.usuario_id = u.usuario_id
    WHERE r.estado IN ('pendiente','en_proceso')
  `);
}

async getReparados() {
  return await AppDataSource.query(`
    SELECT r.reporte_id, r.descripcion, r.fecha_reporte, r.estado,
           u.usuario_id, u.nombre, u.apellido, u.apellido2
    FROM reporte_dano r
    JOIN usuario u ON r.usuario_id = u.usuario_id
    WHERE r.estado = 'reparado'
  `);
}

async getPorUsuario(usuario_id) {
  return await AppDataSource.query(`
    SELECT r.reporte_id, r.descripcion, r.fecha_reporte, r.estado,
           u.usuario_id, u.nombre, u.apellido, u.apellido2
    FROM reporte_dano r
    JOIN usuario u ON r.usuario_id = u.usuario_id
    WHERE r.usuario_id = ?
  `, [usuario_id]);
  }
}

module.exports = new ReporteDanoService();
