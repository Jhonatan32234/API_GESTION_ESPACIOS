const AppDataSource = require("../config/ormconfig");
const PlanEstudio = require("../models/Plan_Estudio");

class PlanEstudioService {
  constructor() {
    this.repo = AppDataSource.getRepository(PlanEstudio);
  }

  async getAll() {
    return await this.repo.find({
      select: ["plan_id", "nombre_carrera", "codigo_plan", "fecha_creacion"],
      relations: ["materias"]
    });
  }

  async getAllBasic() {
  return await this.repo.find({
    select: ["plan_id", "nombre_carrera", "codigo_plan", "fecha_creacion"]
  });
 }


  async getById(id) {
    return await this.repo.findOne({
      where: { plan_id: id },
      relations: ["materias"]
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

module.exports = new PlanEstudioService();
