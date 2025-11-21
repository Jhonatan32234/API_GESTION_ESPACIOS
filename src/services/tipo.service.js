const AppDataSource = require("../config/ormconfig");
const Tipo = require("../models/Tipo");

class TipoService {
  constructor() {
    this.repo = AppDataSource.getRepository(Tipo);
  }

  async getAll() {
    return await this.repo.find({ select: ["tipo_id", "nombre"] });
  }

  async getById(id) {
    return await this.repo.findOneBy({ tipo_id: id });
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
}

module.exports = new TipoService();
