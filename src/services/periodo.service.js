const AppDataSource = require("../config/ormconfig");
const Periodo = require("../models/Periodo");

class PeriodoService {
  constructor() {
    this.repo = AppDataSource.getRepository(Periodo);
  }

  async getAll() {
    return await this.repo.find({ where: { activo: true } });
  }

  async getById(id) {
    return await this.repo.findOne({ where: { periodo_id: id, activo: true } });
  }

  async create(data) {
    const nuevo = this.repo.create({ ...data, activo: true });
    return await this.repo.save(nuevo);
  }

  async update(id, data) {
    const actual = await this.getById(id);
    if (!actual) {
      return { error: "Periodo no encontrado o inactivo" };
    }

    const nuevoAnio = data.anio ?? actual.anio;
    const nuevoTipo = data.tipo_periodo ?? actual.tipo_periodo;
    const nuevaFechaInicio = data.fecha_inicio ?? actual.fecha_inicio;
    const nuevaFechaFin = data.fecha_fin ?? actual.fecha_fin;

    const existeTipo = await this.repo.findOne({
      where: { anio: nuevoAnio, tipo_periodo: nuevoTipo, activo: true }
    });
    if (existeTipo && existeTipo.periodo_id !== Number(id)) {
      return { error: `Ya existe un periodo ${nuevoTipo} del año ${nuevoAnio}` };
    }

    const existeFechas = await this.repo.findOne({
      where: { fecha_inicio: nuevaFechaInicio, fecha_fin: nuevaFechaFin, activo: true }
    });
    if (existeFechas && existeFechas.periodo_id !== Number(id)) {
      return { error: `Ya existe un periodo con las mismas fechas ${nuevaFechaInicio} - ${nuevaFechaFin}` };
    }

    await this.repo.update(id, data);
    return await this.getById(id);
  }

  async delete(id) {
    const periodo = await this.getById(id);
    if (!periodo) {
      return { error: "Periodo no encontrado o ya inactivo" };
    }

    await this.repo.update(id, { activo: false });
    return { mensaje: "Periodo marcado como inactivo" };
  }
}

module.exports = new PeriodoService();
