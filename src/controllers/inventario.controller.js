const inventarioService = require("../services/inventario.service");

class InventarioController {
  async getAll(req, res) {
    const items = await inventarioService.getAll();
    res.json(items);
  }

  async getById(req, res) {
    const item = await inventarioService.getById(req.params.id);
    item ? res.json(item) : res.status(404).json({ mensaje: "No encontrado" });
  }

  async create(req, res) {
    try {
      const item = await inventarioService.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async update(req, res) {
    try {
      const item = await inventarioService.update(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  }

  async delete(req, res) {
    await inventarioService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new InventarioController();
