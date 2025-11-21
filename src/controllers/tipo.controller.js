const tipoService = require("../services/tipo.service");

class TipoController {
  async getAll(req, res) {
    const items = await tipoService.getAll();
    res.json(items);
  }

  async getById(req, res) {
    const { id } = req.params;
    const item = await tipoService.getById(id);
    if (!item) return res.status(404).json({ message: "Tipo no encontrado" });
    res.json(item);
  }

  async create(req, res) {
    const nueva = await tipoService.create(req.body);
    res.status(201).json(nueva);
  }

  async update(req, res) {
    const { id } = req.params;
    const updated = await tipoService.update(id, req.body);
    res.json(updated);
  }

  async delete(req, res) {
    const { id } = req.params;
    await tipoService.delete(id);
    res.status(204).send();
  }
}

module.exports = new TipoController();
