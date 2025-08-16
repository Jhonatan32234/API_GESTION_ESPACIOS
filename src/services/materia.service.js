const AppDataSource = require("../config/ormconfig");
const Materia = require("../models/Materia");
const PlanEstudio = require("../models/Plan_Estudio");

class MateriaService {
  constructor() {
    this.repo = AppDataSource.getRepository(Materia);
    this.planRepo = AppDataSource.getRepository(PlanEstudio);
  }

  async getAll() {
    return await this.repo.find({
      relations: ["plan"],
      select: ["materia_id", "nombre", "codigo_materia", "nivel"]
    });
  }

  async getById(id) {
    return await this.repo.findOne({
      where: { materia_id: id },
      relations: ["plan"]
    });
  }

  async create(data) {
    const { plan_id, nombre, codigo_materia, nivel } = data;

    const plan = await this.planRepo.findOneBy({ plan_id });
    if (!plan) throw new Error("El plan de estudio no existe");

    const existe = await this.repo.findOne({ where: { plan: { plan_id }, codigo_materia } });
    if (existe) throw new Error("Ya existe una materia con ese código en el plan");

    const nueva = this.repo.create({ nombre, codigo_materia, nivel, plan });
    return await this.repo.save(nueva);
  }

  async update(id, data) {
    const materia = await this.repo.findOne({
      where: { materia_id: id },
      relations: ["plan"]
    });
    if (!materia) throw new Error("Materia no encontrada");

    if (data.plan_id) {
      const plan = await this.planRepo.findOneBy({ plan_id: data.plan_id });
      if (!plan) throw new Error("El plan de estudio no existe");
      materia.plan = plan;
    }

    materia.nombre = data.nombre ?? materia.nombre;
    materia.codigo_materia = data.codigo_materia ?? materia.codigo_materia;
    materia.nivel = data.nivel ?? materia.nivel;

    await this.repo.save(materia);
    return materia;
  }

  async delete(id) {
    return await this.repo.delete(id);
  }
}

module.exports = new MateriaService();
