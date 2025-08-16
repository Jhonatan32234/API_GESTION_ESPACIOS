const periodoService = require("../services/periodo.service");

class PeriodoController {
  async getAll(req, res) {
    const periodos = await periodoService.getAll();
    res.json(periodos);
  }

  async getById(req, res) {
    const periodo = await periodoService.getById(req.params.id);
    if (!periodo) {
      return res.status(404).json({ mensaje: "No encontrado" });
    }
    res.json(periodo);
  }

  async create(req, res) {
    const result = await periodoService.create(req.body);
    if (result.error) {
      return res.status(400).json({ mensaje: result.error });
    }
    res.status(201).json(result);
  }

  async update(req, res) {
    const result = await periodoService.update(req.params.id, req.body);
    if (result.error) {
      return res.status(400).json({ mensaje: result.error });
    }
    res.json(result);
  }

  async delete(req, res) {
    await periodoService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new PeriodoController();
