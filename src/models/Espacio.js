const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Espacio",
  tableName: "espacio",
  columns: {
    espacio_id: { primary: true, type: "int", generated: true },
    nombre: { type: "varchar", length: 60 },
    tipo_id: { type: "int", nullable: true },
    
    capacidad: { type: "smallint" },
    descripcion: { type: "text", nullable: true },
    disponible: { type: "boolean", default: true },
    ubicacion_id: { type: "int", nullable: true }
  },
  relations: {
    inventarios: {
      type: "one-to-many",
      target: "EspacioInventario",
      inverseSide: "espacio"
    },
    ubicacion: {
      type: "many-to-one",
      target: "Ubicacion",
      joinColumn: { name: "ubicacion_id" },
      nullable: true,
      onDelete: "SET NULL"
    }
    ,
    tipo: {
      type: "many-to-one",
      target: "Tipo",
      joinColumn: { name: "tipo_id" },
      nullable: true,
      onDelete: "SET NULL"
    },
    
  }
});
