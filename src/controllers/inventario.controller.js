const inventarioService = require("../services/inventario.service");

class InventarioController {
  async getAll(req, res) {
    try {
      const inventario = await inventarioService.getAll();
      res.json(inventario);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el inventario" });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const inventario = await inventarioService.getById(parseInt(id));
      
      if (!inventario) {
        return res.status(404).json({ error: "Elemento de inventario no encontrado" });
      }
      
      res.json(inventario);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el elemento de inventario" });
    }
  }

 async getByEspacio(req, res) {
  try {
    const { espacioId } = req.params;
    
    const inventario = await inventarioService.getByEspacio(parseInt(espacioId));
    
    const resultadoFormateado = inventario
      .filter(item => item.inventario !== null && item.inventario.catalogo_elemento !== null) // Filtrar elementos válidos
      .map(item => {
        const { inventario, espacio } = item;
        const { catalogo_elemento, ...inventarioData } = inventario;
        
        return {
          inventario_id: inventarioData.inventario_id,
          nombre_elemento: catalogo_elemento?.nombre_elemento || 'Sin nombre',
          tipo: catalogo_elemento?.tipo || 'Sin tipo',
          estado: inventarioData.estado || 'desconocido',
          marca: inventarioData.marca,
          modelo: inventarioData.modelo,
          patrimonio: inventarioData.patrimonio,
          cantidad: inventarioData.cantidad || 1,
          observaciones: inventarioData.observaciones,
          fecha_adquisicion: inventarioData.fecha_adquisicion,
          
          espacio_inventario_id: item.espacio_inventario_id,
          espacio_id: espacio?.espacio_id,
          espacio_nombre: espacio?.nombre,
          catalogo_id: catalogo_elemento?.catalogo_id
        };
      });
    
    res.json(resultadoFormateado);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener inventario del espacio",
      details: error.message 
    });
  }
}

  async getByCatalogo(req, res) {
    try {
      const { catalogoId } = req.params;
      const inventario = await inventarioService.getByCatalogo(parseInt(catalogoId));
      res.json(inventario);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener inventario por catálogo" });
    }
  }

  async getByTipo(req, res) {
    try {
      const { tipo } = req.params;
      const inventario = await inventarioService.getByTipo(tipo);
      res.json(inventario);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener inventario por tipo" });
    }
  }

  async getDisponibles(req, res) {
    try {
      const inventario = await inventarioService.getDisponibles();
      res.json(inventario);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener inventario disponible" });
    }
  }

  async create(req, res) {
    try {
      const { catalogo_id, cantidad, marca, modelo, patrimonio, estado, observaciones, fecha_adquisicion } = req.body;

      if (!catalogo_id) {
        return res.status(400).json({ error: "catalogo_id es requerido" });
      }

      const inventario = await inventarioService.create({
        catalogo_id,
        cantidad: cantidad || 1,
        marca,
        modelo,
        patrimonio,
        estado: estado || 'disponible',
        observaciones,
        fecha_adquisicion
      });

      res.status(201).json(inventario);
    } catch (error) {
      if (error.message.includes('Ya existe') || error.message.includes('No existe')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Error al crear elemento de inventario" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { catalogo_id, cantidad, marca, modelo, patrimonio, estado, observaciones } = req.body;

      const inventario = await inventarioService.update(parseInt(id), {
        catalogo_id,
        cantidad,
        marca,
        modelo,
        patrimonio,
        estado,
        observaciones
      });

      res.json(inventario);
    } catch (error) {
      if (error.message.includes('Ya existe') || error.message.includes('No existe')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Error al actualizar elemento de inventario" });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await inventarioService.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      if (error.message.includes('tiene asignaciones activas')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Error al eliminar elemento de inventario" });
    }
  }

  async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({ error: "El campo estado es requerido" });
      }

      const inventario = await inventarioService.cambiarEstado(parseInt(id), estado);
      res.json(inventario);
    } catch (error) {
      if (error.message.includes('Estado no válido')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Error al cambiar estado del inventario" });
    }
  }

  async getConSoftware(req, res) {
    try {
      const inventario = await inventarioService.getConSoftware();
      res.json(inventario);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener inventario con software" });
    }
  }

}

module.exports = new InventarioController();