// Inventario.entity.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Inventario",
  tableName: "inventario",
  columns: {
  inventario_id: { primary: true, type: "int", generated: true },
  nombre_elemento: { type: "varchar", length: 100 },
  tipo: { type: "varchar", length: 20 },
  estado: { type: "varchar", length: 20 },
  descripcion: { type: "text", nullable: true },
  marca: { type: "varchar", length: 50, nullable: true },
  modelo: { type: "varchar", length: 50, nullable: true },
  patrimonio: { type: "varchar", length: 30, nullable: true },
  observaciones: { type: "varchar", length: 255, nullable: true },
  espacio_id: { type: "int", nullable: true } // <-- aquí
},
  relations: {
    espacio: {
      type: "many-to-one",
      target: "Espacio",
      joinColumn: { name: "espacio_id" },
      eager: true,
      nullable: true,
      onDelete: "SET NULL"
    }
  }
});
