// PlanEstudio.entity.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "PlanEstudio",
  tableName: "plan_estudio",
  columns: {
    plan_id: { primary: true, type: "int", generated: true },
    nombre_carrera: { type: "varchar", length: 150 },
    codigo_plan: { type: "varchar", length: 30, unique: true },
    fecha_creacion: { type: "timestamp", createDate: true } 
  },
  relations: {
    materias: {
      type: "one-to-many",
      target: "Materia",
      inverseSide: "plan"
    }
  }
});
