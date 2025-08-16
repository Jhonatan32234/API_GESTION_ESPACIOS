const AppDataSource = require("../config/ormconfig");
const Inventario = require("../models/Inventario");
const Espacio = require("../models/Espacio");
const { Not } = require("typeorm");

class InventarioService {
  constructor() {
    this.repo = AppDataSource.getRepository(Inventario);
    this.espacioRepo = AppDataSource.getRepository(Espacio);
  }

  async getAll() {
  return await this.repo.find({ relations: ["espacio"] });
}

async getById(id) {
  return await this.repo.findOne({
    where: { inventario_id: id },
    relations: ["espacio"]
  });
}


  async create(data) {
  // Verificar patrimonio único
  if (data.patrimonio) {
    const existente = await this.repo.findOneBy({ patrimonio: data.patrimonio });
    if (existente) {
      throw new Error(`Ya existe un elemento con patrimonio "${data.patrimonio}"`);
    }
  }

  let espacio = null;
  if (data.espacio_id) {
    espacio = await this.espacioRepo.findOneBy({ espacio_id: data.espacio_id });
    if (!espacio) {
      throw new Error(`No existe un espacio con ID "${data.espacio_id}"`);
    }
  }

  // Crear inventario asociando el espacio
  const nuevo = this.repo.create({
    ...data,
    espacio: espacio // asignar la entidad completa
  });

  return await this.repo.save(nuevo);
}

async update(id, data) {
  // Verificar patrimonio único
  if (data.patrimonio) {
    const existente = await this.repo.findOne({
      where: { patrimonio: data.patrimonio, inventario_id: Not(id) }
    });
    if (existente) {
      throw new Error(`Ya existe un elemento con patrimonio "${data.patrimonio}"`);
    }
  }

  let espacio = null;
  if (data.espacio_id) {
    espacio = await this.espacioRepo.findOneBy({ espacio_id: data.espacio_id });
    if (!espacio) {
      throw new Error(`No existe un espacio con ID "${data.espacio_id}"`);
    }
  }

  // Actualizar inventario con la relación
  await this.repo.update(id, {
    ...data,
    espacio: espacio // asignar la entidad completa
  });

  return await this.getById(id);
}


  async delete(id) {
    return await this.repo.delete(id);
  }
}

module.exports = new InventarioService();
