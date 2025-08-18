const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Notificacion",
  tableName: "notificacion",
  columns: {
    notificacion_id: { primary: true, type: "int", generated: true },
    tipo: { type: "varchar", length: 20 },
    mensaje: { type: "text" },
    fecha_envio: { type: "timestamp", createDate: true },
    leida: { type: "boolean", default: false },
    enviado: { type: "boolean", default: false },
    relacion_id: { type: "int", nullable: true },
    relacion_tipo: { type: "varchar", length: 30, nullable: true }
  },
  relations: {
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "usuario_id" },
      onDelete: "SET NULL",
      nullable: true
    }
  }
});
