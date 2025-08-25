const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "SolicitudHorario",
  tableName: "solicitud_horario",
  columns: {
    horario_id: { primary: true, type: "int", generated: true },
    dia_semana: { type: "smallint" },
    hora_inicio: { type: "time" },
    hora_fin: { type: "time" }
  },
  relations: {
    solicitud: {
      type: "many-to-one",
      target: "Solicitud",
      joinColumn: { name: "solicitud_id" },
      onDelete: "SET NULL",
      nullable: true
    }
  },
  listeners: {
    beforeInsert: (entity) => {
      if (entity.hora_inicio >= entity.hora_fin) {
        throw new Error("hora_inicio debe ser menor que hora_fin");
      }
    },
    beforeUpdate: (entity) => {
      if (entity.hora_inicio >= entity.hora_fin) {
        throw new Error("hora_inicio debe ser menor que hora_fin");
      }
    }
  }
});