const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Software",
  tableName: "software",
  columns: {
    software_id: { primary: true, type: "int", generated: true },
    nombre: { type: "varchar", length: 100 },
    version: { type: "varchar", length: 50 },
    asignatura_requerida: { type: "varchar", length: 100 },
    fecha_instalacion: { type: "date" },
    fecha_actualizacion: { type: "date", nullable: true }
  },
  relations: {
    inventario: {
      type: "many-to-one",
      target: "Inventario",
      joinColumn: { name: "inventario_id" },
      onDelete: "SET NULL",
      nullable: true
    }
  }
});
