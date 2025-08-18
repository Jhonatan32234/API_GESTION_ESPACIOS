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
  __dirname + "/../models/solicitud.js",
  __dirname + "/../models/solicitud_horario.js",
  __dirname + "/../models/reserva.js",
  __dirname + "/../models/Software.js",
  __dirname + "/../models/Autoevaluacion.js",
  __dirname + "/../models/Notificacion.js",
  __dirname + "/../models/Reporte_Dano.js",
  __dirname + "/../models/Mantenimiento.js",
  __dirname + "/../models/conflicto_recurrente.js",
],

});

module.exports = AppDataSource;
