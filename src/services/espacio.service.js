const AppDataSource = require("../config/ormconfig");
const Espacio = require("../models/Espacio");
const inventarioService = require("./inventario.service");
const espacioInventarioService = require("./espacio_inventario.service");

class EspacioService {
  constructor() {
    this.repo = AppDataSource.getRepository(Espacio);
  }

  async getAll() {
  return await this.repo.find({
    relations: [
      "ubicacion",
      "tipo",
      "inventarios",
      "inventarios.inventario",
      "inventarios.inventario.catalogo_elemento",
    ],
  });
}


  async getById(id) {
    return await this.repo.findOne({
      where: { espacio_id: id },
      relations: [
        "ubicacion",
        "tipo",
        "inventarios",
        "inventarios.inventario",
        "inventarios.inventario.catalogo_elemento",
      ],
    });
  }

  async create(data) {
  const payload = { ...data };

  // extraer array de inventario si viene
  const inventarioArray = Array.isArray(payload.inventario) ? payload.inventario : null;
  delete payload.inventario;

  if (data.tipoId) payload.tipo = { tipo_id: data.tipoId };
  // eliminar propiedades temporales que no existen en la entidad
  delete payload.tipoId;

  const nuevo = this.repo.create(payload);
  const saved = await this.repo.save(nuevo);

  // procesar inventario: crear/usar existentes y asignar
    if (inventarioArray) {
      for (const inv of inventarioArray) {
        if (inv.inventario_id) {
          const updateData = { ...inv };
          delete updateData.inventario_id;
          if (Object.keys(updateData).length) {
            try {
              await inventarioService.update(inv.inventario_id, updateData);
            } catch (err) {
              // si falla la actualización, continuar intentando asignar (o lanzar según preferencia)
              console.warn(`No se pudo actualizar inventario ${inv.inventario_id}: ${err.message}`);
            }
          }

          await espacioInventarioService.asignar(saved.espacio_id, inv.inventario_id);
        } else {
          const creado = await inventarioService.create(inv);
          await espacioInventarioService.asignar(saved.espacio_id, creado.inventario_id);
        }
      }
    }

  return await this.getById(saved.espacio_id);
}


  async update(id, data) {
    const payload = { ...data };

    // extraer y eliminar inventario si viene
    const inventarioArray = Array.isArray(payload.inventario) ? payload.inventario : null;
    delete payload.inventario;

    if (data.tipoId !== undefined) payload.tipo = data.tipoId ? { tipo_id: data.tipoId } : null;
    delete payload.tipoId;

    await this.repo.update(id, payload);

    if (inventarioArray) {
      // 1) Obtener asignaciones actuales para poder borrar los inventarios relacionados
      const asignacionesActuales = await espacioInventarioService.getByEspacio(id);

      // 2) Quitar todas las asignaciones actuales
      await espacioInventarioService.quitarTodosDeEspacio(id);

      // 3) Eliminar físicamente los inventarios que estaban relacionados con este espacio
      for (const asig of asignacionesActuales) {
        const invId = asig.inventario && asig.inventario.inventario_id;
        if (invId) {
          try {
            await inventarioService.delete(invId);
          } catch (err) {
            // si no se puede eliminar un inventario, abortamos la operación para evitar inconsistencias
            throw new Error(`No se pudo eliminar inventario relacionado (id=${invId}): ${err.message}`);
          }
        }
      }

      // 4) Crear/Asignar los inventarios nuevos especificados en el payload
      for (const inv of inventarioArray) {
        if (inv.inventario_id) {
          // Si el cliente proporcionó un inventario existente, lo asignamos (y actualizamos si hay campos)
          const updateData = { ...inv };
          delete updateData.inventario_id;
          if (Object.keys(updateData).length) {
            try {
              await inventarioService.update(inv.inventario_id, updateData);
            } catch (err) {
              throw new Error(`No se pudo actualizar inventario ${inv.inventario_id}: ${err.message}`);
            }
          }

          await espacioInventarioService.asignar(id, inv.inventario_id);
        } else {
          // crear nuevo inventario y asignar
          const creado = await inventarioService.create(inv);
          await espacioInventarioService.asignar(id, creado.inventario_id);
        }
      }
    }

    return await this.getById(id);
  }

  async delete(id) {
    return await this.repo.delete(id);
  }

  async getEspaciosByUbicacion(ubicacionId) {
    return await this.repo.find({
      where: { ubicacion: { ubicacion_id: ubicacionId } }, // filtrando por FK
      relations: [
        "ubicacion",
        "tipo",
        "inventarios",
        "inventarios.inventario",
        "inventarios.inventario.catalogo_elemento",
      ], // incluir datos de las relaciones
    });
  }
}

module.exports = new EspacioService();
