const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Reserva",
  tableName: "reserva",
  columns: {
    reserva_id: { primary: true, type: "int", generated: true },
    fecha: { type: "date" },
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
    },
    espacio: {
      type: "many-to-one",
      target: "Espacio",
      joinColumn: { name: "espacio_id" },
      onDelete: "SET NULL",
      nullable: true
    }
  }
});
