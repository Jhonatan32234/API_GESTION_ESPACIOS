const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Mantenimiento",
  tableName: "mantenimiento",
  columns: {
    mantenimiento_id: { primary: true, type: "int", generated: true },
    tipo: { type: "varchar", length: 20 },
    fecha_programada: { type: "date" },
    fecha_completado: { type: "date", nullable: true },
    costo: { type: "decimal", precision: 10, scale: 2, nullable: true },
    descripcion: { type: "text" },
    estado: { type: "varchar", length: 20, default: "pendiente" }
  },
  relations: {
    reporte: {
      type: "many-to-one",
      target: "ReporteDano",
      joinColumn: { name: "reporte_id" },
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
