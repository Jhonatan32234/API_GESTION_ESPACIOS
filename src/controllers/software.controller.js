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

 async getByInventarioId(req, res) {
    try {
      const { inventario_id } = req.params;
      
      if (!inventario_id) {
        return res.status(400).json({ mensaje: "El parámetro inventario_id es requerido" });
      }

      const software = await softwareService.getByInventarioId(inventario_id);
      
      if (software.length === 0) {
        return res.status(404).json({ 
          mensaje: "No se encontró software asociado a este inventario",
          inventario_id: inventario_id
        });
      }
      
      res.json({
        inventario_id: parseInt(inventario_id),
        total_software: software.length,
        software: software
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        mensaje: "Error al obtener el software por inventario",
        error: error.message 
      });
    }
  }
  async delete(req, res) {
    await softwareService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new SoftwareController();
