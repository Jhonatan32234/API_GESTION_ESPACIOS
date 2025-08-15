const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Usuario",
  tableName: "usuario",
  columns: {
    usuario_id: { primary: true, type: "int", generated: true },
    nombre: { type: "varchar", length: 50 },
    apellido: { type: "varchar", length: 50 },
    apellido2: { type: "varchar", length: 50, nullable: true },
    email: { type: "varchar", length: 150, unique: true },
    contrasena: { type: "varchar", length: 255 },
    rol: { type: "varchar", length: 20 },
    fecha_creacion: { type: "timestamp", createDate: true },
    activo: { type: "boolean", default: true }
  }
});
