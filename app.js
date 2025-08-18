require("dotenv").config();
require("reflect-metadata");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors"); 
const AppDataSource = require("./src/config/ormconfig");
const { swaggerUi, swaggerSpec } = require("./src/config/swagger");
const usuarioRoutes = require("./src/routes/usuario.routes");
const periodoRoutes = require("./src/routes/periodo.routes");
const authRoutes = require("./src/routes/auth.routes");
const materiaRoutes = require("./src/routes/materia.routes");
const espacioRoutes = require("./src/routes/espacio.routes");
const inventarioRoutes = require("./src/routes/inventario.routes");
const solicitudRoutes = require("./src/routes/solicitud.routes");
const plan_estudio = require("./src/routes/plan_estudio.routes");

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

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/periodos", periodoRoutes);
app.use("/api/materias", materiaRoutes);
app.use("/api/espacios", espacioRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/solicitudes", solicitudRoutes);
app.use("/api/planes", plan_estudio);
app.use("/api/auth", authRoutes);

AppDataSource.initialize()
  .then(() => console.log("📦 Base de datos conectada"))
  .catch(err => console.error("❌ Error DB:", err));

module.exports = app;
