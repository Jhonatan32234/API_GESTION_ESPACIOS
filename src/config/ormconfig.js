require("dotenv").config();
const { DataSource } = require("typeorm");

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "gestion_espacios",
  synchronize: true, // ⚠ Solo en desarrollo
  logging: false,
  entities: [__dirname + "/../models/*.js"]
});

module.exports = AppDataSource;
