const AppDataSource = require("../config/ormconfig");
const Espacio = require("../models/Espacio");

class EspacioService {
  constructor() {
    this.repo = AppDataSource.getRepository(Espacio);
  }

  async getAll() {
  return await this.repo.find({
    relations: ["ubicacion"], // incluir la relación de ubicación
  });
}


  async getById(id) {
    return await this.repo.findOneBy({ espacio_id: id });
  }

  async create(data) {
  // data.ubicacion debe ser { ubicacion_id: id }
  const nuevo = this.repo.create(data);
  return await this.repo.save(nuevo);
}


  async update(id, data) {
    await this.repo.update(id, data);
    return await this.getById(id);
  }

  async delete(id) {
    return await this.repo.delete(id);
  }

  async getEspaciosByUbicacion(ubicacionId) {
    return await this.repo.find({
      where: { ubicacion: { ubicacion_id: ubicacionId } }, // filtrando por FK
      relations: ["ubicacion"], // incluir datos de la ubicación
    });
  }
}

module.exports = new EspacioService();
