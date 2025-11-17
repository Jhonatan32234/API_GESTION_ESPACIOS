const AppDataSource = require("../config/ormconfig");
const CatalogoElemento = require("../models/Catalogo_Elemento");

class CatalogoService {
  constructor() {
    this.repo = AppDataSource.getRepository(CatalogoElemento);
  }

  async getAll() {
    return await this.repo.find({
    });
  }

  async getById(id) {
    return await this.repo.findOne({
      where: { catalogo_id: id }
    });
  }

  async getByTipo(tipo) {
    return await this.repo.find({
      where: { tipo }
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

module.exports = new CatalogoService();