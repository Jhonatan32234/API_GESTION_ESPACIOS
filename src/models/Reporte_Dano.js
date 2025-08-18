const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ReporteDano",
  tableName: "reporte_dano",
  columns: {
    reporte_id: { primary: true, type: "int", generated: true },
    descripcion: { type: "text" },
    fecha_reporte: { type: "timestamp", createDate: true },
    estado: { type: "varchar", length: 20, default: "pendiente" }
  },
  relations: {
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "usuario_id" },
      onDelete: "SET NULL",
      nullable: true
    },
    inventario: {
      type: "many-to-one",
      target: "Inventario",
      joinColumn: { name: "inventario_id" },
      onDelete: "SET NULL",
      nullable: true
    }
  }
});
