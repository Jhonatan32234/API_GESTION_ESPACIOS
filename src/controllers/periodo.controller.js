const periodoService = require("../services/periodo.service");

class PeriodoController {
  async getAll(req, res) {
    try {
      const periodos = await periodoService.getAll();
      res.json(periodos);
    } catch (error) {
      console.error('Error en getAll periodos:', error);
      res.status(500).json({ error: "Error al obtener los periodos" });
    }
  }

  async getById(req, res) {
    try {
      const periodo = await periodoService.getById(parseInt(req.params.id));
      if (!periodo) {
        return res.status(404).json({ mensaje: "Periodo no encontrado" });
      }
      res.json(periodo);
    } catch (error) {
      console.error('Error en getById periodos:', error);
      res.status(500).json({ error: "Error al obtener el periodo" });
    }
  }

  async create(req, res) {
    try {
      const { fecha_inicio, fecha_fin, tipo_periodo } = req.body;

      if (!fecha_inicio || !fecha_fin || !tipo_periodo) {
        return res.status(400).json({ 
          mensaje: "fecha_inicio, fecha_fin y tipo_periodo son requeridos" 
        });
      }

      const result = await periodoService.create(req.body);
      if (result.error) {
        return res.status(400).json({ mensaje: result.error });
      }
      res.status(201).json(result);
    } catch (error) {
      console.error('Error en create periodos:', error);
      res.status(500).json({ error: "Error al crear el periodo" });
    }
  }

  async update(req, res) {
    try {
      const result = await periodoService.update(parseInt(req.params.id), req.body);
      if (result.error) {
        return res.status(400).json({ mensaje: result.error });
      }
      res.json(result);
    } catch (error) {
      console.error('Error en update periodos:', error);
      res.status(500).json({ error: "Error al actualizar el periodo" });
    }
  }

  async delete(req, res) {
    try {
      const result = await periodoService.delete(parseInt(req.params.id));
      if (result.error) {
        return res.status(404).json({ mensaje: result.error });
      }
      res.status(200).json(result);
    } catch (error) {
      console.error('Error en delete periodos:', error);
      res.status(500).json({ error: "Error al eliminar el periodo" });
    }
  }
}

module.exports = new PeriodoController();