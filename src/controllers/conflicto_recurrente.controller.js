const conflictoService = require("../services/conflicto_recurrente.service");

class ConflictoRecurrenteController {
  async getAll(req, res) {
    const conflictos = await conflictoService.getAll();
    res.json(conflictos);
  }

  async getById(req, res) {
    const conflicto = await conflictoService.getById(req.params.id);
    conflicto ? res.json(conflicto) : res.status(404).json({ mensaje: "No encontrado" });
  }

  async create(req, res) {
    const conflicto = await conflictoService.create(req.body);
    res.status(201).json(conflicto);
  }

  async update(req, res) {
    const conflicto = await conflictoService.update(req.params.id, req.body);
    res.json(conflicto);
  }

  async delete(req, res) {
    await conflictoService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new ConflictoRecurrenteController();
