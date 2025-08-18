const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Autoevaluacion",
  tableName: "autoevaluacion",
  columns: {
    autoevaluacion_id: { primary: true, type: "int", generated: true },
    categoria: { type: "varchar", length: 20 },
    criterios: { type: "json" },
    fecha_evaluacion: { type: "datetime", createDate: true },
    comentarios: { type: "text", nullable: true }
  },
  relations: {
    periodo: {
      type: "many-to-one",
      target: "Periodo",
      joinColumn: { name: "periodo_id" },
      onDelete: "SET NULL",
      nullable: true
    },
    evaluador: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "evaluador_id" },
      onDelete: "SET NULL",
      nullable: true
    }
  }
});
