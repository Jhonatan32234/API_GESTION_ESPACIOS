const AppDataSource = require("../config/ormconfig");

class MantenimientoService {
  async insertarMantenimiento(usuario_mantenimiento_id, reporte_id, tipo, fecha_programada, descripcion) {
    return await AppDataSource.query(
      `CALL insertar_mantenimiento(?, ?, ?, ?, ?)`,
      [usuario_mantenimiento_id, reporte_id, tipo, fecha_programada, descripcion]
    );
  }

  async completarMantenimiento(mantenimiento_id, fecha_completado, costo) {
    return await AppDataSource.query(
      `CALL completar_mantenimiento(?, ?, ?)`,
      [mantenimiento_id, fecha_completado, costo]
    );
  }

   async cancelarMantenimiento(mantenimiento_id) {
    const result = await AppDataSource.query(
      `CALL cancelar_mantenimiento(?)`,
      [mantenimiento_id]
    );
    return result;
  }
  
  async getPendientesEnProceso() {
  return await AppDataSource.query(
    `SELECT m.mantenimiento_id, m.tipo, m.fecha_programada, m.estado, m.descripcion,
            u.usuario_id, u.nombre, u.apellido, u.apellido2
     FROM mantenimiento m
     INNER JOIN usuario u ON m.usuario_id = u.usuario_id
     WHERE m.estado IN ('pendiente','en_proceso')`
  );
}

async getCompletados() {
  return await AppDataSource.query(
    `SELECT m.mantenimiento_id, m.tipo, m.fecha_programada, m.fecha_completado, m.costo, m.estado, m.descripcion,
            u.usuario_id, u.nombre, u.apellido, u.apellido2
     FROM mantenimiento m
     INNER JOIN usuario u ON m.usuario_id = u.usuario_id
     WHERE m.estado = 'completado'`
  );
}

async getPorUsuario(usuario_id) {
  return await AppDataSource.query(
    `SELECT m.mantenimiento_id, m.tipo, m.fecha_programada, m.estado, m.descripcion,
            u.usuario_id, u.nombre, u.apellido, u.apellido2
     FROM mantenimiento m
     INNER JOIN usuario u ON m.usuario_id = u.usuario_id
     WHERE m.usuario_id = ?`,
    [usuario_id]
  );
}

}

module.exports = new MantenimientoService();
