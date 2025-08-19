const ubicacionService = require("../services/ubicacion.service");

class UbicacionController {
  async getAll(req, res) {
    const ubicaciones = await ubicacionService.getAll();
    res.json(ubicaciones);
  }

  async getById(req, res) {
    const { id } = req.params;
    const ubicacion = await ubicacionService.getById(id);
    if (!ubicacion) {
      return res.status(404).json({ message: "Ubicación no encontrada" });
    }
    res.json(ubicacion);
  }

  async create(req, res) {
    const nueva = await ubicacionService.create(req.body);
    res.status(201).json(nueva);
  }

  async update(req, res) {
    const { id } = req.params;
    const actualizada = await ubicacionService.update(id, req.body);
    res.json(actualizada);
  }

  async delete(req, res) {
    const { id } = req.params;
    await ubicacionService.delete(id);
    res.status(204).send();
  }
}

module.exports = new UbicacionController();
