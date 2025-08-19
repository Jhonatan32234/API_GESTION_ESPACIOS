const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Espacio",
  tableName: "espacio",
  columns: {
    espacio_id: { primary: true, type: "int", generated: true },
    nombre: { type: "varchar", length: 60 },
    tipo: { type: "varchar", length: 20 },
    categoria: { type: "varchar", length: 20 },
    capacidad: { type: "smallint" },
    descripcion: { type: "text", nullable: true },
    disponible: { type: "boolean", default: true },

    // Aquí exponemos la columna de la FK directamente
    ubicacion_id: {
      type: "int",
      nullable: true
    }
  },
  relations: {
    inventarios: {
      type: "one-to-many",
      target: "Inventario",
      inverseSide: "espacio"
      // No ponemos cascade delete porque queremos que los inventarios permanezcan
    },
    ubicacion: {
      type: "many-to-one",
      target: "Ubicacion",
      joinColumn: { name: "ubicacion_id" }, // la FK en espacio
      nullable: true,
      onDelete: "SET NULL"
    }
  }
});
