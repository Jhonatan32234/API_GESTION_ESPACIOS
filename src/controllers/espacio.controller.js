const espacioService = require("../services/espacio.service");

class EspacioController {
  async getAll(req, res) {
  const espacios = await espacioService.getAll();

  // Mapear para mostrar nombre de la ubicación en lugar del id
  const resultado = espacios.map(e => ({
    espacio_id: e.espacio_id,
    nombre: e.nombre,
    tipo: e.tipo,
    categoria: e.categoria,
    capacidad: e.capacidad,
    descripcion: e.descripcion,
    disponible: e.disponible,
    ubicacion: e.ubicacion ? e.ubicacion.ubicacion : null // mostrar nombre de ubicación
  }));

  res.json(resultado);
}


  async getEspaciosByUbicacion(req, res) {
  const { ubicacionId } = req.params;
  const espacios = await espacioService.getEspaciosByUbicacion(ubicacionId);

  if (!espacios.length) {
    return res.status(404).json({ mensaje: "No se encontraron espacios para esta ubicación" });
  }

  res.json(espacios);
  }


  async getById(req, res) {
    const espacio = await espacioService.getById(req.params.id);
    espacio ? res.json(espacio) : res.status(404).json({ mensaje: "No encontrado" });
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
    const espacio = await espacioService.update(req.params.id, req.body);
    res.json(espacio);
  }

  async delete(req, res) {
    await espacioService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new EspacioController();
