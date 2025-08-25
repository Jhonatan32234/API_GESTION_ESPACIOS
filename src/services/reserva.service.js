const AppDataSource = require("../config/ormconfig");
const Reserva = require("../models/Reserva"); // Asegúrate de tener la entidad Reserva definida en models

class ReservaService {
  constructor() {
    this.repo = AppDataSource.getRepository(Reserva);
  }

  /**
   * Elimina reservas de una fecha dada que intersecten con un rango horario indicado
   * @param {Date} fecha - Fecha de la reserva
   * @param {string} hora_inicio - Hora inicio en formato 'HH:mm:ss'
   * @param {string} hora_fin - Hora fin en formato 'HH:mm:ss'
   */
  async eliminarReservasPorFechaHora(fecha, hora_inicio, hora_fin) {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where("fecha = :fecha", { fecha })
      .andWhere("hora_inicio < :hora_fin AND hora_fin > :hora_inicio", { hora_fin, hora_inicio })
      .execute();

    return result;
  }
}

module.exports = new ReservaService();
