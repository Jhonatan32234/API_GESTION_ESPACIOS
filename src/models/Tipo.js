const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Tipo",
  tableName: "tipo",
  columns: {
    tipo_id: { primary: true, type: "int", generated: true },
    nombre: { type: "varchar", length: 60 }
  },
  relations: {
    espacios: {
      type: "one-to-many",
      target: "Espacio",
      inverseSide: "tipo"
    }
  }
});
