require("dotenv").config();
require("reflect-metadata");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors"); 
const AppDataSource = require("./src/config/ormconfig");
const { swaggerUi, swaggerSpec } = require("./src/config/swagger");
const routes = require("./src/routes/usuario.routes");
const authRoutes = require("./src/routes/auth.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173", 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true 
}));

// Swagger
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/usuarios", routes);
app.use("/api/auth", authRoutes);

AppDataSource.initialize()
  .then(() => console.log("📦 Base de datos conectada"))
  .catch(err => console.error("❌ Error DB:", err));

module.exports = app;
