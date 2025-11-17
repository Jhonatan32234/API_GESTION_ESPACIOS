const catalogoService = require("../services/catalogo.service");

class CatalogoController {
  async getAll(req, res) {
    try {
      const catalogos = await catalogoService.getAll();
      res.json(catalogos);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el catálogo" });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const catalogo = await catalogoService.getById(parseInt(id));
      
      if (!catalogo) {
        return res.status(404).json({ error: "Elemento del catálogo no encontrado" });
      }
      
      res.json(catalogo);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el elemento del catálogo" });
    }
  }

  async getByTipo(req, res) {
    try {
      const { tipo } = req.params;
      const catalogos = await catalogoService.getByTipo(tipo);
      res.json(catalogos);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener elementos por tipo" });
    }
  }

  async create(req, res) {
    try {
      const { nombre_elemento, tipo, descripcion } = req.body;

      if (!nombre_elemento || !tipo) {
        return res.status(400).json({ error: "Nombre y tipo son requeridos" });
      }

      const catalogo = await catalogoService.create({
        nombre_elemento,
        tipo,
        descripcion
      });

      res.status(201).json(catalogo);
    } catch (error) {
      res.status(500).json({ error: "Error al crear elemento del catálogo" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre_elemento, tipo, descripcion } = req.body;

      const catalogo = await catalogoService.update(parseInt(id), {
        nombre_elemento,
        tipo,
        descripcion
      });

      res.json(catalogo);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar elemento del catálogo" });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await catalogoService.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar elemento del catálogo" });
    }
  }
}

module.exports = new CatalogoController();