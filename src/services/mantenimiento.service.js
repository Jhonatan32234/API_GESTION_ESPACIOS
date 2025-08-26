const AppDataSource = require("../config/ormconfig");

class MantenimientoService {
  // Insertar mantenimiento
  async insertarMantenimiento(usuario_mantenimiento_id, reporte_id, tipo, fecha_programada, descripcion) {
    const result = await AppDataSource.query(
      "CALL insertar_mantenimiento(?, ?, ?, ?, ?)",
      [usuario_mantenimiento_id, reporte_id, tipo, fecha_programada, descripcion]
    );
    return result;
  }

  // Completar mantenimiento
  async completarMantenimiento(mantenimiento_id, fecha_completado, costo) {
    const result = await AppDataSource.query(
      "CALL completar_mantenimiento(?, ?, ?)",
      [mantenimiento_id, fecha_completado, costo]
    );
    return result;
  }
}

module.exports = new MantenimientoService();
