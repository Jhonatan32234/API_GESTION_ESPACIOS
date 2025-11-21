const AppDataSource = require("../config/ormconfig");
const Inventario = require("../models/Inventario");
const CatalogoElemento = require("../models/Catalogo_Elemento");
const EspacioInventario = require("../models/Espacio_Inventario");
const { Not, IsNull } = require("typeorm");

class InventarioService {
  constructor() {
    this.repo = AppDataSource.getRepository(Inventario);
    this.catalogoRepo = AppDataSource.getRepository(CatalogoElemento);
    this.espacioInventarioRepo = AppDataSource.getRepository(EspacioInventario);
  }

  async getAll() {
    return await this.repo.find({ 
      relations: ["catalogo_elemento"] 
    });
  }

  async getById(id) {
    return await this.repo.findOne({
      where: { inventario_id: id },
      relations: ["catalogo_elemento", "espacios", "espacios.espacio"]
    });
  }

  async getByEspacio(espacio_id) {
  try {        
    const resultado = await this.espacioInventarioRepo.find({
      where: { 
        espacio: { espacio_id: espacio_id }
      },
      relations: ["inventario", "inventario.catalogo_elemento", "espacio"]
    });
    
    return resultado;
  } catch (error) {
    throw error;
  }
}

  async getByCatalogo(catalogo_id) {
    return await this.repo.find({
      where: { catalogo_elemento: { catalogo_id: catalogo_id } },
      relations: ["catalogo_elemento", "espacios", "espacios.espacio"]
    });
  }
  

  async getByTipo(tipo) {
    return await this.repo.find({
      where: { catalogo_elemento: { tipo: tipo } },
      relations: ["catalogo_elemento", "espacios", "espacios.espacio"]
    });
  }

 async getDisponibles() {
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
      )
    `;
    
    const resultados = await AppDataSource.query(query);
    
    return resultados;
  } catch (error) {
    throw new Error(`Error al obtener inventario disponible: ${error.message}`);
  }
}

  async create(data) {
    // Verificar que el catálogo existe
    const catalogo = await this.catalogoRepo.findOne({
      where: { catalogo_id: data.catalogo_id }
    });

    if (!catalogo) {
      throw new Error(`No existe un elemento del catálogo con ID "${data.catalogo_id}"`);
    }

    // Verificar patrimonio único (solo para equipamiento)
    if (data.patrimonio && catalogo.tipo === 'equipamiento') {
      const existente = await this.repo.findOne({ 
        where: { patrimonio: data.patrimonio } 
      });
      if (existente) {
        throw new Error(`Ya existe un elemento con patrimonio "${data.patrimonio}"`);
      }
    }

    const nuevo = this.repo.create({
      ...data,
      catalogo_elemento: catalogo
    });

    return await this.repo.save(nuevo);
  }

  async update(id, data) {
    const inventarioExistente = await this.getById(id);
    if (!inventarioExistente) {
      throw new Error("Inventario no encontrado");
    }

    // Verificar catálogo si se está actualizando
    if (data.catalogo_id) {
      const catalogo = await this.catalogoRepo.findOne({
        where: { catalogo_id: data.catalogo_id }
      });
      if (!catalogo) {
        throw new Error(`No existe un elemento del catálogo con ID "${data.catalogo_id}"`);
      }
      data.catalogo_elemento = catalogo;
      delete data.catalogo_id;
    }

    await this.repo.update(id, data);
    return await this.getById(id);
  }

  async delete(id) {
    // Eliminar asignaciones en espacio_inventario relacionadas con este inventario
    try {
      await this.espacioInventarioRepo.delete({ inventario: { inventario_id: id } });
    } catch (err) {
      throw new Error(`No se pudo eliminar las asignaciones de espacio_inventario para inventario ${id}: ${err.message}`);
    }

    // Eliminar el inventario físicamente
    try {
      return await this.repo.delete(id);
    } catch (err) {
      throw new Error(`Error al eliminar inventario ${id}: ${err.message}`);
    }
  }

  async cambiarEstado(id, nuevoEstado) {
    const estadosPermitidos = ['disponible', 'en_uso', 'mantenimiento', 'danado', 'baja'];
    
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(`Estado no válido. Estados permitidos: ${estadosPermitidos.join(', ')}`);
    }

    await this.repo.update(id, { estado: nuevoEstado });
    return await this.getById(id);
  }

  async getConSoftware() {
    const query = `
      SELECT 
        i.inventario_id,
        i.cantidad,
        i.marca,
        i.modelo,
        i.patrimonio,
        i.estado,
        i.observaciones,
        i.fecha_adquisicion,
        ce.nombre_elemento,
        ce.tipo,
        ce.descripcion as catalogo_descripcion,
        s.software_id,
        s.nombre AS software_nombre,
        s.version AS software_version,
        s.asignatura_requerida,
        s.fecha_instalacion,
        s.fecha_actualizacion
      FROM inventario i
      INNER JOIN catalogo_elemento ce ON i.catalogo_id = ce.catalogo_id
      LEFT JOIN software s ON i.inventario_id = s.inventario_id
      ORDER BY ce.tipo, ce.nombre_elemento
    `;
    return await AppDataSource.query(query);
  }
}

module.exports = new InventarioService();