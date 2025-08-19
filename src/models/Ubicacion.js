const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Ubicacion",
  tableName: "ubicacion",
  columns: {
    ubicacion_id: { primary: true, type: "int", generated: true },
    ubicacion: { type: "varchar", length: 120 }, 
  },
  relations: {
    espacios: {
      type: "one-to-many",
      target: "Espacio",
      inverseSide: "ubicacion",
      onDelete: "SET NULL" // si borras una ubicación, los espacios quedan sin ubicación
    }
  }
});
