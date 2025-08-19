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

  async getTipos() {
    const espacios = await this.repo.find({
      select: ["tipo"],
      order: { tipo: "ASC" }
    });
    
    const tiposUnicos = [...new Set(espacios.map(e => e.tipo))];
    return tiposUnicos;
  }

  async getCategorias() {
    const espacios = await this.repo.find({
      select: ["categoria"],
      order: { categoria: "ASC" }
    });
    
    const categoriasUnicas = [...new Set(espacios.map(e => e.categoria))];
    return categoriasUnicas;
  }

  async getUbicaciones() {
    const espacios = await this.repo.find({
      select: ["ubicacion"],
      order: { ubicacion: "ASC" }
    });
    
    const ubicacionesUnicas = [...new Set(espacios.map(e => e.ubicacion))];
    return ubicacionesUnicas;
  }

  async getByUbicacion(ubicacion) {
  return await this.repo.find({
    where: { ubicacion },
    order: { nombre: "ASC" }
  });
  }


}

module.exports = new EspacioService();
