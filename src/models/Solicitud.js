const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Solicitud",
  tableName: "solicitud",
  columns: {
    solicitud_id: { primary: true, type: "int", generated: true },
    grupo: { type: "varchar", length: 50 },
    fecha: { type: "date", nullable: true },
    motivo: { type: "varchar", length: 100 },
    cantidad_asistentes: { type: "smallint" },
    estado: { type: "varchar", length: 20, default: "pendiente" },
    fecha_creacion: { type: "timestamp", createDate: true }
  },
  relations: {
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "usuario_id" },
      onDelete: "SET NULL",
      nullable: true
    },
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
    materia: {
      type: "many-to-one",
      target: "Materia",
      joinColumn: { name: "materia_id" },
      onDelete: "SET NULL",
      nullable: true
    },
    horarios: {
      type: "one-to-many",
      target: "SolicitudHorario",
      inverseSide: "solicitud"
    },
    reservas: {
      type: "one-to-many",
      target: "Reserva",
      inverseSide: "solicitud"
    }
  }
});
