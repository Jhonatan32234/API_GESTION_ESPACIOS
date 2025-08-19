const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Periodo",
  tableName: "periodo",
  columns: {
    periodo_id: { primary: true, type: "int", generated: true },
    nombre: { type: "varchar", length: 50 },
    fecha_inicio: { type: "date" },
    fecha_fin: { type: "date" },
    anio: { type: "smallint" },
    tipo_periodo: { type: "varchar", length: 30 },
    activo: { type: "boolean", default: true } 
  }
});
