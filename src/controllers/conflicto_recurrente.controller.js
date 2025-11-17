const conflictoService = require("../services/conflicto_recurrente.service");

class ConflictoRecurrenteController {
  async getAll(req, res) {
    try {
      const conflictos = await conflictoService.getAll();
      res.json(conflictos);
    } catch (error) {
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener los conflictos.'
      });
    }
  }

  async getById(req, res) {
    const { id } = req.params;    
    try {
      const result = await conflictoService.getById(id);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          mensaje: result.mensaje
        });
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener el conflicto.'
      });
    }
  }

  async obtenerConflictosPendientes(req, res) {
    try {
      const result = await conflictoService.obtenerConflictosPendientes();
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        mensaje: 'Error al obtener los conflictos pendientes.'
      });
    }
  }

  async resolverConflicto(req, res) {
    const { conflicto_id, ganador_solicitud_id, admin_id } = req.body;
    

    if (!conflicto_id || !ganador_solicitud_id) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los campos conflicto_id y ganador_solicitud_id son requeridos.'
      });
    }

    try {
      const result = await conflictoService.resolverConflictoRecurrente(
        conflicto_id, 
        ganador_solicitud_id, 
        admin_id
      );
      
      res.json({ 
        success: true,
        mensaje: 'Conflicto resuelto exitosamente.',
        data: result 
      });
    } catch (error) {          
      if (error.message.includes('CONFLICTO_NO_EXISTE')) {
        return res.status(404).json({ 
          success: false,
          mensaje: error.message.split(': ')[1]
        });
      } else if (error.message.includes('SOLICITUD_INVALIDA')) {
        return res.status(400).json({ 
          success: false,
          mensaje: error.message.split(': ')[1]
        });
      } else {
        return res.status(500).json({ 
          success: false,
          mensaje: "Error al resolver el conflicto." 
        });
      }
    }
  }
}

module.exports = new ConflictoRecurrenteController();