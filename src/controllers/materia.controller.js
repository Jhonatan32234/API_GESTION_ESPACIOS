const materiaService = require("../services/materia.service");

class MateriaController {
  async getAll(req, res) {
    const materias = await materiaService.getAll();
    res.json(materias);
  }

  async getById(req, res) {
    const materia = await materiaService.getById(req.params.id);
    materia ? res.json(materia) : res.status(404).json({ mensaje: "No encontrada" });
  }

  async create(req, res) {
    try {
      const materia = await materiaService.create(req.body);
      res.status(201).json(materia);
    } catch (err) {
      res.status(400).json({ mensaje: err.message });
    }
  }

  async update(req, res) {
    try {
      const materia = await materiaService.update(req.params.id, req.body);
      res.json(materia);
    } catch (err) {
      res.status(400).json({ mensaje: err.message });
    }
  }

  async delete(req, res) {
    await materiaService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new MateriaController();
