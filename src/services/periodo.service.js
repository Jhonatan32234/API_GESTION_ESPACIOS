const AppDataSource = require("../config/ormconfig");
const Periodo = require("../models/Periodo");

class PeriodoService {
  constructor() {
    this.repo = AppDataSource.getRepository(Periodo);
  }

  async getAll() {
    return await this.repo.find({ 
      where: { activo: true },
      order: { fecha_inicio: 'DESC' }
    });
  }

  async getById(id) {
    return await this.repo.findOne({ 
      where: { periodo_id: id, activo: true } 
    });
  }

  async create(data) {
    const { fecha_inicio, fecha_fin, tipo_periodo } = data;

    // Validar que fecha_inicio sea menor que fecha_fin
    if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
      return { error: "La fecha de inicio debe ser anterior a la fecha de fin" };
    }

    // Validar que no exista un periodo con el mismo tipo y fechas solapadas
    const periodoExistente = await this.repo.findOne({
      where: {
        tipo_periodo: tipo_periodo,
        activo: true,
        fecha_inicio: fecha_inicio,
        fecha_fin: fecha_fin
      }
    });

    if (periodoExistente) {
      return { error: `Ya existe un periodo ${tipo_periodo} con las mismas fechas` };
    }

    // Validar que no se solapen las fechas con otros periodos activos
    const periodoSolapado = await this.repo
      .createQueryBuilder('periodo')
      .where('periodo.activo = :activo', { activo: true })
      .andWhere('(periodo.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin OR periodo.fecha_fin BETWEEN :fecha_inicio AND :fecha_fin)', {
        fecha_inicio: fecha_inicio,
        fecha_fin: fecha_fin
      })
      .getOne();

    if (periodoSolapado) {
      return { error: "Las fechas se solapan con otro periodo activo" };
    }

    const nuevo = this.repo.create({ 
      fecha_inicio, 
      fecha_fin, 
      tipo_periodo, 
      activo: true 
    });
    
    return await this.repo.save(nuevo);
  }

  async update(id, data) {
    const actual = await this.getById(id);
    if (!actual) {
      return { error: "Periodo no encontrado o inactivo" };
    }

    const { fecha_inicio, fecha_fin, tipo_periodo } = data;

    // Validar que fecha_inicio sea menor que fecha_fin si se proporcionan
    if (fecha_inicio && fecha_fin && new Date(fecha_inicio) >= new Date(fecha_fin)) {
      return { error: "La fecha de inicio debe ser anterior a la fecha de fin" };
    }

    const nuevaFechaInicio = fecha_inicio || actual.fecha_inicio;
    const nuevaFechaFin = fecha_fin || actual.fecha_fin;
    const nuevoTipo = tipo_periodo || actual.tipo_periodo;

    // Validar que no exista otro periodo con el mismo tipo y fechas (excluyendo el actual)
    const periodoExistente = await this.repo.findOne({
      where: {
        tipo_periodo: nuevoTipo,
        fecha_inicio: nuevaFechaInicio,
        fecha_fin: nuevaFechaFin,
        activo: true,
        periodo_id: Not(id)
      }
    });

    if (periodoExistente) {
      return { error: `Ya existe otro periodo ${nuevoTipo} con las mismas fechas` };
    }

    // Validar que no se solapen las fechas con otros periodos activos (excluyendo el actual)
    const periodoSolapado = await this.repo
      .createQueryBuilder('periodo')
      .where('periodo.activo = :activo', { activo: true })
      .andWhere('periodo.periodo_id != :id', { id })
      .andWhere('(periodo.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin OR periodo.fecha_fin BETWEEN :fecha_inicio AND :fecha_fin)', {
        fecha_inicio: nuevaFechaInicio,
        fecha_fin: nuevaFechaFin
      })
      .getOne();

    if (periodoSolapado) {
      return { error: "Las fechas se solapan con otro periodo activo" };
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