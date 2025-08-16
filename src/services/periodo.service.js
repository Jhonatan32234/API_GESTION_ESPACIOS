const AppDataSource = require("../config/ormconfig");
const Periodo = require("../models/Periodo");

class PeriodoService {
  constructor() {
    this.repo = AppDataSource.getRepository(Periodo);
  }

  async getAll() {
    return await this.repo.find();
  }

  async getById(id) {
    return await this.repo.findOneBy({ periodo_id: id });
  }

  async create(data) {
    // Verificar duplicado por año y tipo_periodo
    const existeTipo = await this.repo.findOne({
      where: { anio: data.anio, tipo_periodo: data.tipo_periodo }
    });

    if (existeTipo) {
      return { error: `Ya existe un periodo ${data.tipo_periodo} del año ${data.anio}` };
    }

    // Verificar duplicado exacto por fecha_inicio y fecha_fin
    const existeFechas = await this.repo.findOne({
      where: { fecha_inicio: data.fecha_inicio, fecha_fin: data.fecha_fin }
    });

    if (existeFechas) {
      return { error: `Ya existe un periodo con las mismas fechas ${data.fecha_inicio} - ${data.fecha_fin}` };
    }

    const nuevo = this.repo.create(data);
    return await this.repo.save(nuevo);
  }

  async update(id, data) {
    const actual = await this.getById(id);
    if (!actual) {
      return { error: "Periodo no encontrado" };
    }

    const nuevoAnio = data.anio ?? actual.anio;
    const nuevoTipo = data.tipo_periodo ?? actual.tipo_periodo;
    const nuevaFechaInicio = data.fecha_inicio ?? actual.fecha_inicio;
    const nuevaFechaFin = data.fecha_fin ?? actual.fecha_fin;

    // Verificar duplicado por año y tipo_periodo (excluyendo el mismo registro)
    const existeTipo = await this.repo.findOne({
      where: {
        anio: nuevoAnio,
        tipo_periodo: nuevoTipo
      }
    });
    
    if (existeTipo && existeTipo.periodo_id !== Number(id)) {
      return { error: `Ya existe un periodo ${nuevoTipo} del año ${nuevoAnio}` };
    }


    // Verificar duplicado exacto por fechas (excluyendo el mismo registro)
    const existeFechas = await this.repo.findOne({
      where: {
        fecha_inicio: nuevaFechaInicio,
        fecha_fin: nuevaFechaFin
      }
    });
    
    if (existeFechas && existeFechas.periodo_id !== Number(id)) {
      return { error: `Ya existe un periodo con las mismas fechas ${nuevaFechaInicio} - ${nuevaFechaFin}` };
    }


    await this.repo.update(id, data);
    return await this.getById(id);
  }

  async delete(id) {
    return await this.repo.delete(id);
  }
}

module.exports = new PeriodoService();
