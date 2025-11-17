const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "CatalogoElemento",
  tableName: "catalogo_elemento",
  columns: {
    catalogo_id: { primary: true, type: "int", generated: true },
    nombre_elemento: { type: "varchar", length: 100 },
    tipo: { type: "enum", enum: ["equipamiento", "mobiliario", "infraestructura"] },
    descripcion: { type: "text", nullable: true },
    fecha_creacion: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" }
  },
  relations: {
    inventarios: {
      type: "one-to-many",
      target: "Inventario",
      inverseSide: "catalogo_elemento"
    }
  }
});