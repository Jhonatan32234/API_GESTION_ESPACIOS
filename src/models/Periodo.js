const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Periodo",
  tableName: "periodo",
  columns: {
    periodo_id: { primary: true, type: "int", generated: true },
    fecha_inicio: { type: "date" },
    fecha_fin: { type: "date" },
    activo: { type: "boolean", default: true }
  }
});