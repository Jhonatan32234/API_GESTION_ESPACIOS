const periodoService = require("../services/periodo.service");

class PeriodoController {
  async getAll(req, res) {
    try {
      const periodos = await periodoService.getAll();
      res.status(200).json(periodos);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al obtener periodos", 
        error: error.message 
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const periodo = await periodoService.getById(id);
      
      if (!periodo) {
        return res.status(404).json({ 
          success: false, 
          message: "Periodo no encontrado" 
        });
      }
      
      res.status(200).json(periodo);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al obtener periodo", 
        error: error.message 
      });
    }
  }

  async create(req, res) {
    try {
      const result = await periodoService.create(req.body);
      
      if (result.success === false) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al crear periodo", 
        error: error.message 
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const result = await periodoService.update(id, req.body);
      
      if (result.success === false) {
        return res.status(400).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al actualizar periodo", 
        error: error.message 
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await periodoService.delete(id);
      
      if (result.success === false) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al eliminar periodo", 
        error: error.message 
      });
    }
  }

  async activarPeriodo(req, res) {
    try {
      const { id } = req.params;
      const result = await periodoService.activarPeriodo(id);
      
      if (result.success === false) {
        return res.status(400).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al activar periodo", 
        error: error.message 
      });
    }
  }

  async desactivarPeriodo(req, res) {
    try {
      const { id } = req.params;
      const result = await periodoService.desactivarPeriodo(id);
      
      if (result.success === false) {
        return res.status(400).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al desactivar periodo", 
        error: error.message 
      });
    }
  }

  async getPeriodoActivo(req, res) {
    try {
      const periodo = await periodoService.getPeriodoActivo();
      
      if (!periodo) {
        return res.status(404).json({ 
          success: false, 
          message: "No hay periodo activo actualmente" 
        });
      }
      
      res.status(200).json(periodo);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al obtener periodo activo", 
        error: error.message 
      });
    }
  }
}

module.exports = new PeriodoController();