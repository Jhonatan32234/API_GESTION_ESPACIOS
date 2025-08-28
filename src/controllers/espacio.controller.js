const espacioService = require("../services/espacio.service");

class EspacioController {
  async getAll(req, res) {
    const espacios = await espacioService.getAll();

    // Ahora devolvemos también el ubicacion_id además del nombre
    const resultado = espacios.map(e => ({
      espacio_id: e.espacio_id,
      nombre: e.nombre,
      tipo: e.tipo,
      categoria: e.categoria,
      capacidad: e.capacidad,
      descripcion: e.descripcion,
      disponible: e.disponible,
      ubicacion_id: e.ubicacion ? e.ubicacion.ubicacion_id : null,
      ubicacion: e.ubicacion ? e.ubicacion.ubicacion : null // opcional: mostrar también el nombre
    }));

    res.json(resultado);
  }

  async getEspaciosByUbicacion(req, res) {
    const { ubicacionId } = req.params;
    const espacios = await espacioService.getEspaciosByUbicacion(ubicacionId);

    if (!espacios.length) {
      return res.status(404).json({ mensaje: "No se encontraron espacios para esta ubicación" });
    }

    // Igual que en getAll, devolvemos ubicacion_id y opcional el nombre
    const resultado = espacios.map(e => ({
      espacio_id: e.espacio_id,
      nombre: e.nombre,
      tipo: e.tipo,
      categoria: e.categoria,
      capacidad: e.capacidad,
      descripcion: e.descripcion,
      disponible: e.disponible,
      ubicacion_id: e.ubicacion ? e.ubicacion.ubicacion_id : null,
      ubicacion: e.ubicacion ? e.ubicacion.ubicacion : null
    }));

    res.json(resultado);
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await espacioService.getById(parseInt(id));
      if (!data) {
        return res.status(404).json({ error: "Espacio no encontrado" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el espacio" });
    }
  }

  async create(req, res) {
    const { nombre, tipo, categoria, ubicacionId, capacidad, descripcion, disponible } = req.body;

    const espacio = await espacioService.create({
      nombre,
      tipo,
      categoria,
      ubicacion: { ubicacion_id: ubicacionId }, // relacionando por entidad
      capacidad,
      descripcion,
      disponible
    });

    res.status(201).json(espacio);
  }

  async update(req, res) {
    const { nombre, tipo, categoria, ubicacionId, capacidad, descripcion, disponible } = req.body;

    const espacio = await espacioService.update(req.params.id, {
      nombre,
      tipo,
      categoria,
      ubicacion: ubicacionId ? { ubicacion_id: ubicacionId } : undefined, // si mandan ubicacionId, actualizamos relación
      capacidad,
      descripcion,
      disponible
    });

    res.json(espacio);
  }

  async delete(req, res) {
    await espacioService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new EspacioController();
