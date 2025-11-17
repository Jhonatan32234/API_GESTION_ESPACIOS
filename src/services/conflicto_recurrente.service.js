const AppDataSource = require("../config/ormconfig");
const ConflictoRecurrente = require("../models/Conflicto_Recurrente");

class ConflictoRecurrenteService {
  constructor() {
    this.repo = AppDataSource.getRepository(ConflictoRecurrente);
  }

  async getAll() {
    try {
      const result = await this.repo.find({
        relations: ["solicitud1", "solicitud2", "ganador"]
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async resolverConflictoRecurrente(conflicto_id, ganador_solicitud_id, admin_id) {
    try {
      const result = await AppDataSource.query(
        `CALL resolver_conflicto_recurrente(?, ?, ?)`,
        [conflicto_id, ganador_solicitud_id, admin_id]
      );
      return { success: true, data: result };
    } catch (error) {            
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        if (error.sqlState === '45001') {
          throw new Error('CONFLICTO_NO_EXISTE: El conflicto no existe o ya fue resuelto.');
        } else if (error.sqlState === '45002') {
          throw new Error('SOLICITUD_INVALIDA: La solicitud ganadora no pertenece a este conflicto.');
        }
      }
      
      throw new Error(`Error al resolver el conflicto: ${error.message}`);
    }
  }

  async obtenerConflictosPendientes() {
    try {
      const result = await AppDataSource.query(`
        SELECT 
          cr.conflicto_id,
          cr.dia_semana,
          cr.hora_inicio,
          cr.hora_fin,
          cr.estado,
          cr.fecha_resolucion,
          cr.observaciones,
          cr.espacio_id,
          e.nombre as espacio_nombre,
          cr.periodo_id,
          p.tipo_periodo,
          cr.solicitud_id_1,
          cr.solicitud_id_2,
          cr.ganador_solicitud_id,
          s1.usuario_id as usuario_solicitud_1,
          s2.usuario_id as usuario_solicitud_2,
          u1.nombre as nombre_solicitante_1,
          u2.nombre as nombre_solicitante_2,
          s1.grupo as grupo_solicitud_1,
          s2.grupo as grupo_solicitud_2
        FROM conflicto_recurrente cr
        LEFT JOIN espacio e ON cr.espacio_id = e.espacio_id
        LEFT JOIN periodo p ON cr.periodo_id = p.periodo_id
        LEFT JOIN solicitud s1 ON cr.solicitud_id_1 = s1.solicitud_id
        LEFT JOIN solicitud s2 ON cr.solicitud_id_2 = s2.solicitud_id
        LEFT JOIN usuario u1 ON s1.usuario_id = u1.usuario_id
        LEFT JOIN usuario u2 ON s2.usuario_id = u2.usuario_id
        WHERE cr.estado = 'pendiente'
        ORDER BY cr.conflicto_id DESC
      `);
      return { success: true, data: result };
    } catch (error) {
      throw new Error(`Error al obtener conflictos: ${error.message}`);
    }
  }

  async getById(conflicto_id) {
    try {
      const result = await AppDataSource.query(`
        SELECT 
          cr.*,
          e.nombre as espacio_nombre,
          p.tipo_periodo,
          p.fecha_inicio,
          p.fecha_fin,
          s1.grupo as grupo_solicitud_1,
          s1.motivo as motivo_solicitud_1,
          s1.estado as estado_solicitud_1,
          s2.grupo as grupo_solicitud_2,
          s2.motivo as motivo_solicitud_2,
          s2.estado as estado_solicitud_2,
          u1.nombre as nombre_solicitante_1,
          u1.apellido as apellido_solicitante_1,
          u1.email as email_solicitante_1,
          u2.nombre as nombre_solicitante_2,
          u2.apellido as apellido_solicitante_2,
          u2.email as email_solicitante_2
        FROM conflicto_recurrente cr
        LEFT JOIN espacio e ON cr.espacio_id = e.espacio_id
        LEFT JOIN periodo p ON cr.periodo_id = p.periodo_id
        LEFT JOIN solicitud s1 ON cr.solicitud_id_1 = s1.solicitud_id
        LEFT JOIN solicitud s2 ON cr.solicitud_id_2 = s2.solicitud_id
        LEFT JOIN usuario u1 ON s1.usuario_id = u1.usuario_id
        LEFT JOIN usuario u2 ON s2.usuario_id = u2.usuario_id
        WHERE cr.conflicto_id = ?
      `, [conflicto_id]);
      
      
      if (result.length === 0) {
        return { success: false, data: null, mensaje: 'El conflicto no existe.' };
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      throw new Error(`Error al obtener el conflicto: ${error.message}`);
    }
  }
}

module.exports = new ConflictoRecurrenteService();