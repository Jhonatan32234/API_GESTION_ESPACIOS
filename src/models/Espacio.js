// Espacio.entity.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Espacio",
  tableName: "espacio",
  columns: {
    espacio_id: { primary: true, type: "int", generated: true },
    nombre: { type: "varchar", length: 60 },
    tipo: { type: "varchar", length: 20 },
    categoria: { type: "varchar", length: 20 },
    ubicacion: { type: "varchar", length: 120 },
    capacidad: { type: "smallint" },
    descripcion: { type: "text", nullable: true },
    disponible: { type: "boolean", default: true }
  },
  relations: {
    inventarios: {
      type: "one-to-many",
      target: "Inventario",
      inverseSide: "espacio"
      // No ponemos cascade delete porque queremos que los inventarios permanezcan
    }
  }
});
