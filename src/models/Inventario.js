//Inventario entity
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Inventario",
  tableName: "inventario",
  columns: {
    inventario_id: { primary: true, type: "int", generated: true },
    cantidad: { type: "int", default: 1 },
    marca: { type: "varchar", length: 50, nullable: true },
    modelo: { type: "varchar", length: 50, nullable: true },
    patrimonio: { type: "varchar", length: 30, nullable: true },
    estado: { type: "varchar", length: 20, default: "disponible" },
    observaciones: { type: "varchar", length: 255, nullable: true },
    fecha_creacion: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
    catalogo_id: { type: "int" }
  },
  relations: {
    catalogo_elemento: {
      type: "many-to-one",
      target: "CatalogoElemento",
      joinColumn: { 
        name: "catalogo_id" 
      },
      eager: true,
      onDelete: "RESTRICT"
    },
    espacios: {
      type: "one-to-many",
      target: "EspacioInventario",
      inverseSide: "inventario"
    }
  }
});