const espacioInventarioService = require("../services/espacio_inventario.service");

class EspacioInventarioController {
  async getByEspacio(req, res) {
    try {
      const { espacioId } = req.params;
      const asignaciones = await espacioInventarioService.getByEspacio(parseInt(espacioId));
      
      const resultado = asignaciones.map(asig => ({
        espacio_inventario_id: asig.espacio_inventario_id,
        fecha_asignacion: asig.fecha_asignacion,
        inventario: {
          inventario_id: asig.inventario.inventario_id,
          cantidad: asig.inventario.cantidad,
          marca: asig.inventario.marca,
          modelo: asig.inventario.modelo,
          patrimonio: asig.inventario.patrimonio,
          estado: asig.inventario.estado,
          catalogo_elemento: asig.inventario.catalogo_elemento
        },
        espacio: {
          espacio_id: asig.espacio.espacio_id,
          nombre: asig.espacio.nombre
        }
      }));

      res.json(resultado);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener inventario del espacio" });
    }
  }

  async getByInventario(req, res) {
    try {
      const { inventarioId } = req.params;
      const asignaciones = await espacioInventarioService.getByInventario(parseInt(inventarioId));
      res.json(asignaciones);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener asignaciones del inventario" });
    }
  }

  async asignar(req, res) {
    try {
      const { espacioId, inventarioId } = req.body;

      if (!espacioId || !inventarioId) {
        return res.status(400).json({ error: "Espacio ID e Inventario ID son requeridos" });
      }

      const asignacion = await espacioInventarioService.asignar(espacioId, inventarioId);
      
      res.status(201).json({
        success: true,
        data: asignacion,
        message: 'Inventario asignado al espacio exitosamente'
      });
    } catch (error) {
      res.status(500).json({ error: "Error al asignar inventario al espacio" });
    }
  }

  async reasignar(req, res) {
    try {
      const { espacioInventarioId } = req.params;
      const { nuevoEspacioId } = req.body;

      if (!nuevoEspacioId) {
        return res.status(400).json({ error: "Nuevo espacio ID es requerido" });
      }

      const asignacion = await espacioInventarioService.reasignar(
        parseInt(espacioInventarioId), 
        nuevoEspacioId
      );

      res.json({
        success: true,
        data: asignacion,
        message: 'Inventario reasignado exitosamente'
      });
    } catch (error) {
      res.status(500).json({ error: "Error al reasignar inventario" });
    }
  }

  async quitar(req, res) {
    try {
      const { espacioInventarioId } = req.params;
      const resultado = await espacioInventarioService.quitar(parseInt(espacioInventarioId));

      if (!resultado) {
        return res.status(404).json({ error: "Asignación no encontrada" });
      }

      res.json({
        success: true,
        message: 'Inventario removido del espacio exitosamente'
      });
    } catch (error) {
      res.status(500).json({ error: "Error al remover inventario del espacio" });
    }
  }

  async quitarTodosDeEspacio(req, res) {
    try {
      const { espacioId } = req.params;
      const cantidad = await espacioInventarioService.quitarTodosDeEspacio(parseInt(espacioId));

      res.json({
        success: true,
        message: `${cantidad} elementos de inventario removidos del espacio`
      });
    } catch (error) {
      res.status(500).json({ error: "Error al remover inventario del espacio" });
    }
  }

  async getInventarioDisponible(req, res) {
    try {
      const inventario = await espacioInventarioService.getInventarioDisponible();
      res.json(inventario);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener inventario disponible" });
    }
  }
}

module.exports = new EspacioInventarioController();