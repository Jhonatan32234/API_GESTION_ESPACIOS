const AppDataSource = require("../config/ormconfig");

class SoftwareService {

  // Obtener todos los software con su inventario
  async getAll() {
    const query = `
      SELECT 
        s.software_id,
        s.nombre,
        s.version,
        s.asignatura_requerida,
        s.fecha_instalacion,
        s.fecha_actualizacion,
        i.inventario_id,
        i.estado,
        i.marca,
        i.modelo,
        i.patrimonio,
        i.observaciones
      FROM software s
      INNER JOIN inventario i ON s.inventario_id = i.inventario_id
    `;
    return await AppDataSource.query(query);
  }

  // Obtener software por id
  async getById(id) {
    const query = `
      SELECT 
        s.software_id,
        s.nombre,
        s.version,
        s.asignatura_requerida,
        s.fecha_instalacion,
        s.fecha_actualizacion,
        i.inventario_id,
        i.estado,
        i.marca,
        i.modelo,
        i.patrimonio,
        i.observaciones
      FROM software s
      INNER JOIN inventario i ON s.inventario_id = i.inventario_id
      WHERE s.software_id = ?
    `;
    const result = await AppDataSource.query(query, [id]);
    return result[0] || null;
  }

  // Crear software
  async create(data) {
    const query = `
      INSERT INTO software 
        (inventario_id, nombre, version, asignatura_requerida, fecha_instalacion)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.inventario_id,
      data.nombre,
      data.version,
      data.asignatura_requerida,
      data.fecha_instalacion
    ];
    const result = await AppDataSource.query(query, params);

    // Devolver el registro completo con inventario
    return this.getById(result.insertId);
  }

  // Actualizar software
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.nombre) { fields.push("nombre = ?"); params.push(data.nombre); }
    if (data.version) { fields.push("version = ?"); params.push(data.version); }
    if (data.asignatura_requerida) { fields.push("asignatura_requerida = ?"); params.push(data.asignatura_requerida); }
    if (data.fecha_actualizacion) { fields.push("fecha_actualizacion = ?"); params.push(data.fecha_actualizacion); }
    if (data.inventario_id) { fields.push("inventario_id = ?"); params.push(data.inventario_id); }

    if (fields.length === 0) return this.getById(id); // nada que actualizar

    const query = `UPDATE software SET ${fields.join(", ")} WHERE software_id = ?`;
    params.push(id);

    await AppDataSource.query(query, params);

    return this.getById(id);
  }


  async getByInventarioId(inventario_id) {
    const query = `
      SELECT 
        s.software_id,
        s.nombre,
        s.version,
        s.asignatura_requerida,
        s.fecha_instalacion,
        s.fecha_actualizacion,
        i.inventario_id,
        i.estado,
        i.marca,
        i.modelo,
        i.patrimonio,
        i.observaciones,
        c.nombre_elemento,
        c.tipo,
        c.descripcion
      FROM software s
      INNER JOIN inventario i ON s.inventario_id = i.inventario_id
      INNER JOIN catalogo_elemento c ON i.catalogo_id = c.catalogo_id
      WHERE s.inventario_id = ?
      ORDER BY s.nombre
    `;
    return await AppDataSource.query(query, [inventario_id]);
  }
  
  // Eliminar software
  async delete(id) {
    const query = `DELETE FROM software WHERE software_id = ?`;
    const result = await AppDataSource.query(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new SoftwareService();
