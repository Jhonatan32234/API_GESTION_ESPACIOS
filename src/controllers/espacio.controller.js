const espacioService = require("../services/espacio.service");

class EspacioController {
  async getAll(req, res) {
    const espacios = await espacioService.getAll();
    res.json(espacios);
  }

  async getById(req, res) {
    const espacio = await espacioService.getById(req.params.id);
    espacio ? res.json(espacio) : res.status(404).json({ mensaje: "No encontrado" });
  }

  async create(req, res) {
    const espacio = await espacioService.create(req.body);
    res.status(201).json(espacio);
  }

  async update(req, res) {
    const espacio = await espacioService.update(req.params.id, req.body);
    res.json(espacio);
  }

  async delete(req, res) {
    await espacioService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new EspacioController();
