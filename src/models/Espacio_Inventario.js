const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EspacioInventario",
  tableName: "espacio_inventario",
  columns: {
    espacio_inventario_id: { 
      primary: true, 
      type: "int", 
      generated: true 
    },
    espacio_id: { 
      type: "int" 
    },
    inventario_id: { 
      type: "int" 
    }
  },
  relations: {
    espacio: {
      type: "many-to-one",
      target: "Espacio",
      joinColumn: { 
        name: "espacio_id" 
      },
      onDelete: "CASCADE"
    },
    inventario: {
      type: "many-to-one",
      target: "Inventario",
      joinColumn: { 
        name: "inventario_id" 
      },
      onDelete: "CASCADE"
    }
  }
});