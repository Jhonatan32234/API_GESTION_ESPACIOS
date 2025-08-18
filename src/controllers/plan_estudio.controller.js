const planEstudioService = require("../services/plan_estudio.service");

class PlanEstudioController {
  async getAll(req, res) {
    const planes = await planEstudioService.getAll();
    res.json(planes);
  }

  async getAllBasic(req, res) {
  const planes = await planEstudioService.getAllBasic();
  res.json(planes);
  }


  async getById(req, res) {
    const plan = await planEstudioService.getById(req.params.id);
    plan ? res.json(plan) : res.status(404).json({ mensaje: "No encontrado" });
  }

  async create(req, res) {
    const plan = await planEstudioService.create(req.body);
    res.status(201).json(plan);
  }

  async update(req, res) {
    const plan = await planEstudioService.update(req.params.id, req.body);
    res.json(plan);
  }

  async delete(req, res) {
    await planEstudioService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new PlanEstudioController();
