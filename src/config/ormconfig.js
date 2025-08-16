require("dotenv").config();
const { DataSource } = require("typeorm");

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || "mar",
  password: process.env.DB_PASS || "mar",
  database: process.env.DB_NAME || "traundo",
  synchronize: true, // ⚠ Solo en desarrollo
  logging: false,
  entities: [
  __dirname + "/../models/Usuario.js",
  __dirname + "/../models/periodo.js",
  __dirname + "/../models/plan_estudio.js",
  __dirname + "/../models/materia.js",
  __dirname + "/../models/espacio.js",
  __dirname + "/../models/inventario.js",
],

});

module.exports = AppDataSource;
