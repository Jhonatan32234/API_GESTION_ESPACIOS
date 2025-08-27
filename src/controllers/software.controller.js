const softwareService = require("../services/software.service");

class SoftwareController {
  async getAll(req, res) {
    const softwares = await softwareService.getAll();
    res.json(softwares);
  }

  async getById(req, res) {
    const software = await softwareService.getById(req.params.id);
    software ? res.json(software) : res.status(404).json({ mensaje: "No encontrado" });
  }

  async create(req, res) {
    const software = await softwareService.create(req.body);
    res.status(201).json(software);
  }

  async update(req, res) {
    const software = await softwareService.update(req.params.id, req.body);
    res.json(software);
  }

  async delete(req, res) {
    await softwareService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new SoftwareController();
