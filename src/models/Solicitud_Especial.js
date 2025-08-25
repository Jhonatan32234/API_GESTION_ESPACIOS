const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "SolicitudEspecial",
  tableName: "solicitud_especial",
  columns: {
    solicitud_especial_id: { primary: true, type: "int", generated: true },
    fecha: { type: "date" },
    motivo: { type: "varchar", length: 100 },
    cantidad_asistentes: { type: "smallint" },
    hora_inicio: { type: "time" },
    hora_fin: { type: "time" },
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
    reservas: {
      type: "one-to-many",
      target: "Reserva",
      inverseSide: "solicitud_especial"
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