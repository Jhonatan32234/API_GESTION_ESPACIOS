const AppDataSource = require("../config/ormconfig");
const EspacioInventario = require("../models/Espacio_Inventario");
const Inventario = require("../models/Inventario");

class EspacioInventarioService {
  constructor() {
    this.repo = AppDataSource.getRepository(EspacioInventario);
    this.inventarioRepo = AppDataSource.getRepository(Inventario);
  }

  async getByEspacio(espacioId) {
    return await this.repo.find({
      where: { 
        espacio: { espacio_id: espacioId }
      },
      relations: ["inventario", "inventario.catalogo_elemento", "espacio"]
    });
  }

  async getByInventario(inventarioId) {
    return await this.repo.find({
      where: { 
        inventario: { inventario_id: inventarioId }
      },
      relations: ["espacio", "inventario"]
    });
  }

  async asignar(espacioId, inventarioId) {
    // Verificar si ya existe una asignación para este inventario
    const asignacionExistente = await this.repo.findOne({
      where: { 
        inventario: { inventario_id: inventarioId }
      }
    });

    if (asignacionExistente) {
      throw new Error(`El inventario ya está asignado al espacio ID: ${asignacionExistente.espacio.espacio_id}`);
    }

    // Verificar si ya existe esta combinación exacta
    const combinacionExistente = await this.repo.findOne({
      where: { 
        espacio: { espacio_id: espacioId },
        inventario: { inventario_id: inventarioId }
      }
    });

    if (combinacionExistente) {
      throw new Error('Esta asignación ya existe');
    }

    // Crear nueva asignación
    const nuevaAsignacion = this.repo.create({
      espacio: { espacio_id: espacioId },
      inventario: { inventario_id: inventarioId }
    });

    return await this.repo.save(nuevaAsignacion);
  }

  async reasignar(espacioInventarioId, nuevoEspacioId) {
    const asignacion = await this.repo.findOne({
      where: { espacio_inventario_id: espacioInventarioId },
      relations: ['inventario']
    });

    if (!asignacion) {
      throw new Error('Asignación no encontrada');
    }

    // Verificar si el inventario ya está asignado al nuevo espacio
    const existeEnNuevoEspacio = await this.repo.findOne({
      where: { 
        espacio: { espacio_id: nuevoEspacioId },
        inventario: { inventario_id: asignacion.inventario.inventario_id }
      }
    });

    if (existeEnNuevoEspacio) {
      throw new Error('El inventario ya está asignado a este espacio');
    }

    // Actualizar la asignación existente con el nuevo espacio
    await this.repo.update(
      { espacio_inventario_id: espacioInventarioId },
      { espacio: { espacio_id: nuevoEspacioId } }
    );

    return await this.repo.findOne({
      where: { espacio_inventario_id: espacioInventarioId },
      relations: ['inventario', 'espacio']
    });
  }

  async quitar(espacioInventarioId) {
    const result = await this.repo.delete(espacioInventarioId);
    return result.affected > 0;
  }

  async quitarTodosDeEspacio(espacioId) {
    const result = await this.repo.delete({
      espacio: { espacio_id: espacioId }
    });
    return result.affected;
  }

  async quitarDeInventario(inventarioId) {
    const result = await this.repo.delete({
      inventario: { inventario_id: inventarioId }
    });
    return result.affected;
  }

 async getInventarioDisponible() {
  try {
    
    const query = `
      SELECT 
        i.*,
        ce.nombre_elemento,
        ce.tipo,
        ce.descripcion as catalogo_descripcion
      FROM inventario i
      INNER JOIN catalogo_elemento ce ON i.catalogo_id = ce.catalogo_id
      WHERE i.estado = 'disponible'
      AND i.inventario_id NOT IN (
        SELECT DISTINCT ei.inventario_id 
        FROM espacio_inventario ei
        WHERE ei.inventario_id IS NOT NULL
      )
    `;
    
    const resultados = await AppDataSource.query(query);
    return resultados;
  } catch (error) {
    console.error('Error en getInventarioDisponible:', error);
    throw error;
  }
}

  async verificarAsignacion(espacioId, inventarioId) {
    return await this.repo.findOne({
      where: { 
        espacio: { espacio_id: espacioId },
        inventario: { inventario_id: inventarioId }
      }
    });
  }

  async getEspaciosConInventario() {
    const query = `
      SELECT 
        e.espacio_id,
        e.nombre as espacio_nombre,
        e.tipo as espacio_tipo,
        COUNT(ei.inventario_id) as total_inventario,
        GROUP_CONCAT(DISTINCT ce.tipo) as tipos_inventario
      FROM espacio e
      LEFT JOIN espacio_inventario ei ON e.espacio_id = ei.espacio_id
      LEFT JOIN inventario i ON ei.inventario_id = i.inventario_id
      LEFT JOIN catalogo_elemento ce ON i.catalogo_id = ce.catalogo_id
      GROUP BY e.espacio_id, e.nombre, e.tipo
      ORDER BY e.nombre
    `;
    
    return await AppDataSource.query(query);
  }

  async getInventarioPorTipoEnEspacio(espacioId) {
    const query = `
      SELECT 
        ce.tipo,
        ce.nombre_elemento,
        COUNT(i.inventario_id) as cantidad,
        SUM(i.cantidad) as unidades_totales
      FROM espacio_inventario ei
      INNER JOIN inventario i ON ei.inventario_id = i.inventario_id
      INNER JOIN catalogo_elemento ce ON i.catalogo_id = ce.catalogo_id
      WHERE ei.espacio_id = ?
      GROUP BY ce.tipo, ce.nombre_elemento
      ORDER BY ce.tipo, cantidad DESC
    `;
    
    return await AppDataSource.query(query, [espacioId]);
  }
}

module.exports = new EspacioInventarioService();