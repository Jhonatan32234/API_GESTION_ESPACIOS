const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Usuario",
  tableName: "usuarios",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true
    },
    nombre: {
      type: "varchar",
      length: 100
    },
    email: {
      type: "varchar",
      unique: true
    }
  }
});
