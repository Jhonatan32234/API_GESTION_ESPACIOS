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
  entities: [__dirname + "/../models/*.js"]
});

module.exports = AppDataSource;
