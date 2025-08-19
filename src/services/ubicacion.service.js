const AppDataSource = require("../config/ormconfig");
const Ubicacion = require("../models/Ubicacion");

class UbicacionService {
  constructor() {
    this.repo = AppDataSource.getRepository(Ubicacion);
  }

  async getAll() {
    return await this.repo.find({
      select: ["ubicacion_id", "ubicacion"]
    });
  }

  async getById(id) {
    return await this.repo.findOneBy({ ubicacion_id: id });
  }

  async create(data) {
    const nuevaUbicacion = this.repo.create(data);
    return await this.repo.save(nuevaUbicacion);
  }

  async update(id, data) {
    await this.repo.update(id, data);
    return await this.getById(id);
  }

  async delete(id) {
    return await this.repo.delete(id);
  }
}

module.exports = new UbicacionService();
