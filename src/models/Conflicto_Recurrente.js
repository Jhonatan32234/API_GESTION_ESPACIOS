const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ConflictoRecurrente",
  tableName: "conflicto_recurrente",
  columns: {
    conflicto_id: { primary: true, type: "int", generated: true },
    dia_semana: { type: "smallint" },
    hora_inicio: { type: "time" },
    hora_fin: { type: "time" },
    estado: { type: "varchar", length: 20, default: "pendiente" },
    fecha_resolucion: { type: "timestamp", nullable: true },
    observaciones: { type: "text", nullable: true }
  },
  relations: {
    espacio: {
      type: "many-to-one",
      target: "Espacio",
      joinColumn: { name: "espacio_id" },
      onDelete: "SET NULL",
      nullable: true
    },
    periodo: {
      type: "many-to-one",
      target: "Periodo",
      joinColumn: { name: "periodo_id" },
      onDelete: "SET NULL",
      nullable: true
    },
    solicitud1: {
      type: "many-to-one",
      target: "Solicitud",
      joinColumn: { name: "solicitud_id_1" },
      onDelete: "SET NULL",
      nullable: true
    },
    solicitud2: {
      type: "many-to-one",
      target: "Solicitud",
      joinColumn: { name: "solicitud_id_2" },
      onDelete: "SET NULL",
      nullable: true
    },
    ganador: {
      type: "many-to-one",
      target: "Solicitud",
      joinColumn: { name: "ganador_solicitud_id" },
      onDelete: "SET NULL",
      nullable: true
    }
  }
});
