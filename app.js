require("dotenv").config();
require("reflect-metadata");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors"); 
const AppDataSource = require("./src/config/ormconfig");
const runProcedures = require("./src/config/procQuery");

const { swaggerUi, swaggerSpec } = require("./src/config/swagger");
const usuarioRoutes = require("./src/routes/usuario.routes");
const periodoRoutes = require("./src/routes/periodo.routes");
const authRoutes = require("./src/routes/auth.routes");
const materiaRoutes = require("./src/routes/materia.routes");
const espacioRoutes = require("./src/routes/espacio.routes");
const inventarioRoutes = require("./src/routes/inventario.routes");
const solicitudRoutes = require("./src/routes/solicitud.routes");
const plan_estudioRoutes = require("./src/routes/plan_estudio.routes");
const ubicacionRoutes = require("./src/routes/ubicacion.routes");
const solicitud_especialRoutes = require("./src/routes/solicitud_especial.routes");
const reporte_danoRoutes = require("./src/routes/reporte_dano.routes");
const catalogoElementoRoutes = require("./src/routes/catalogo.routes");
const espacioInventarioRoutes = require("./src/routes/espacio_inventario.routes");
const tipoRoutes = require("./src/routes/tipo.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ["https://espacios.alejandroz.cloud", "http://localhost:5173"], 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", // Añadido OPTIONS por seguridad
  credentials: true,
  // 🚨 CRUCIAL: Le dice al navegador que permita leer y guardar la cookie 
  // enviada en contextos cross-origin distintos.
  exposedHeaders: ["set-cookie"] 
}));

// Swagger
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/periodos", periodoRoutes);
app.use("/api/materias", materiaRoutes);
app.use("/api/espacios", espacioRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/solicitudes", solicitudRoutes);
app.use("/api/planes", plan_estudioRoutes);
app.use("/api/ubicaciones", ubicacionRoutes);
app.use("/api/solicitud_especial", solicitud_especialRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reporte", reporte_danoRoutes);
app.use("/api/catalogo", catalogoElementoRoutes);
app.use("/api/espacio_inventario", espacioInventarioRoutes);
app.use("/api/tipos", tipoRoutes);

AppDataSource.initialize()
  .then(async () => {
    console.log("📦 Base de datos conectada");
    await runProcedures();
  })
  .catch(err => console.error("❌ Error DB:", err));

module.exports = app;
