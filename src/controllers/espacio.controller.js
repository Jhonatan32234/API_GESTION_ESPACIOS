const espacioService = require("../services/espacio.service");

class EspacioController {
  async getAll(req, res) {
    const espacios = await espacioService.getAll();

    // Ahora devolvemos también el ubicacion_id además del nombre
    const resultado = espacios.map(e => ({
      espacio_id: e.espacio_id,
      nombre: e.nombre,
      tipo_id: e.tipo ? e.tipo.tipo_id : null,
      tipo: e.tipo ? e.tipo.nombre : null,
      capacidad: e.capacidad,
      descripcion: e.descripcion,
      disponible: e.disponible,
      ubicacion_id: e.ubicacion ? e.ubicacion.ubicacion_id : null,
      ubicacion: e.ubicacion ? e.ubicacion.ubicacion : null, // opcional: mostrar también el nombre
      inventarios: Array.isArray(e.inventarios)
        ? e.inventarios.map(asig => ({
            espacio_inventario_id: asig.espacio_inventario_id,
            inventario: asig.inventario
              ? {
                  inventario_id: asig.inventario.inventario_id,
                  cantidad: asig.inventario.cantidad,
                  marca: asig.inventario.marca,
                  modelo: asig.inventario.modelo,
                  patrimonio: asig.inventario.patrimonio,
                  estado: asig.inventario.estado,
                  observaciones: asig.inventario.observaciones,
                  catalogo_elemento: asig.inventario.catalogo_elemento || null
                }
              : null
          }))
        : []
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
      tipo_id: e.tipo ? e.tipo.tipo_id : null,
      tipo: e.tipo ? e.tipo.nombre : null,
      capacidad: e.capacidad,
      descripcion: e.descripcion,
      disponible: e.disponible,
      ubicacion_id: e.ubicacion ? e.ubicacion.ubicacion_id : null,
      ubicacion: e.ubicacion ? e.ubicacion.ubicacion : null,
      inventarios: Array.isArray(e.inventarios)
        ? e.inventarios.map(asig => ({
            espacio_inventario_id: asig.espacio_inventario_id,
            inventario: asig.inventario
              ? {
                  inventario_id: asig.inventario.inventario_id,
                  cantidad: asig.inventario.cantidad,
                  marca: asig.inventario.marca,
                  modelo: asig.inventario.modelo,
                  patrimonio: asig.inventario.patrimonio,
                  estado: asig.inventario.estado,
                  observaciones: asig.inventario.observaciones,
                  catalogo_elemento: asig.inventario.catalogo_elemento || null
                }
              : null
          }))
        : []
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
    const { nombre, tipoId, ubicacionId, capacidad, descripcion, disponible, inventario } = req.body;

    const espacio = await espacioService.create({
      nombre,
      tipoId,
      ubicacion: ubicacionId ? { ubicacion_id: ubicacionId } : undefined,
      capacidad,
      descripcion,
      disponible,
      inventario // array opcional de inventarios a crear/asignar
    });

    res.status(201).json(espacio);
  }

  async update(req, res) {
    const { nombre, tipoId, ubicacionId, capacidad, descripcion, disponible, inventario } = req.body;

    const espacio = await espacioService.update(req.params.id, {
      nombre,
      tipoId,
      ubicacion: ubicacionId ? { ubicacion_id: ubicacionId } : undefined, // si mandan ubicacionId, actualizamos relación
      capacidad,
      descripcion,
      disponible,
      inventario // array opcional para reemplazar asignaciones
    });

    res.json(espacio);
  }

  async delete(req, res) {
    await espacioService.delete(req.params.id);
    res.status(204).send();
  }
}

module.exports = new EspacioController();
