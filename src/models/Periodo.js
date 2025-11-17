const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Periodo",
  tableName: "periodo",
  columns: {
    periodo_id: { primary: true, type: "int", generated: true },
    fecha_inicio: { type: "date" },
    fecha_fin: { type: "date" },
    tipo_periodo: { type: "varchar", length: 30 },
    activo: { type: "boolean", default: true } 
  }
});
//nombre y anio eliminado