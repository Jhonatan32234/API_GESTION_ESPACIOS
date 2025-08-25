const AppDataSource = require("../config/ormconfig");
const ConflictoRecurrente = require("../models/Conflicto_Recurrente");

class ConflictoRecurrenteService {
  constructor() {
    this.repo = AppDataSource.getRepository(ConflictoRecurrente);
  }

  async getAll() {
    return await this.repo.find({
      relations: ["espacio", "periodo", "solicitud1", "solicitud2", "ganador"]
    });
  }

  async getById(id) {
    return await this.repo.findOne({
      where: { conflicto_id: id },
      relations: ["espacio", "periodo", "solicitud1", "solicitud2", "ganador"]
    });
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

module.exports = new ConflictoRecurrenteService();
