const express = require("express");
require("reflect-metadata");
const AppDataSource = require("./src/config/ormconfig");
const { swaggerUi, swaggerSpec } = require("./src/config/swagger");

const routes = require("./src/routes");

const app = express();

app.use(express.json());

// Documentación Swagger
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas API
app.use("/api", routes);

// Conexión DB
AppDataSource.initialize()
  .then(() => console.log("📦 Base de datos conectada"))
  .catch(err => console.error("❌ Error DB:", err));

module.exports = app;
