require("dotenv").config();
const { DataSource } = require("typeorm");

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "mydb",
  synchronize: true, // ⚠ Solo en desarrollo
  logging: false,
  entities: [__dirname + "/../models/*.js"],

});

module.exports = AppDataSource;
