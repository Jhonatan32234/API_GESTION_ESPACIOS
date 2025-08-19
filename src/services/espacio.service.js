const AppDataSource = require("../config/ormconfig");
const Espacio = require("../models/Espacio");

class EspacioService {
  constructor() {
    this.repo = AppDataSource.getRepository(Espacio);
  }

  async getAll() {
    return await this.repo.find();
  }

  async getById(id) {
    return await this.repo.findOneBy({ espacio_id: id });
  }

  async create(data) {
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

  async getSolicitudesByUbicacion(ubicacionId) {
    return await this.solicitudRepo
      .createQueryBuilder("solicitud")
      .innerJoinAndSelect("solicitud.espacio", "espacio")
      .innerJoinAndSelect("espacio.ubicacion", "ubicacion")
      .where("ubicacion.ubicacion_id = :ubicacionId", { ubicacionId })
      .getMany();
  }
}

module.exports = new EspacioService();
