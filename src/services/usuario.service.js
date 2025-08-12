const AppDataSource = require("../config/ormconfig");
const Usuario = require("../models/Usuario");

class UsuarioService {
  async getAll() {
    const repo = AppDataSource.getRepository(Usuario);
    return await repo.find();
  }

  async create(data) {
    const repo = AppDataSource.getRepository(Usuario);
    const nuevo = repo.create(data);
    return await repo.save(nuevo);
  }
}

module.exports = new UsuarioService();
