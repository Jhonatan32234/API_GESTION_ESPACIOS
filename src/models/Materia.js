// Materia.entity.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Materia",
  tableName: "materia",
  columns: {
    materia_id: { primary: true, type: "int", generated: true },
    nombre: { type: "varchar", length: 150 },
    codigo_materia: { type: "varchar", length: 30 },
    nivel: { type: "smallint" }
  },
  relations: {
    plan: {
      type: "many-to-one",
      target: "PlanEstudio",
      joinColumn: { name: "plan_id" },
      eager: true,
      nullable: true,      // Permite NULL
      onDelete: "SET NULL" // Al eliminar el PlanEstudio, plan_id queda en NULL
    }
  },
  uniques: [
    {
      name: "UQ_plan_codigo",
      columns: ["plan", "codigo_materia"]
    }
  ]
});
