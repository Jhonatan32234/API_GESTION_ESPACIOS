require("dotenv").config();
require("reflect-metadata");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors"); 
const AppDataSource = require("./src/config/ormconfig");
const runProcedures = require("./src/config/procQuery"); // 👈 importamos aquí

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
const reservaRoutes = require("./src/routes/reserva.routes");
const solicitud_especialRoutes = require("./src/routes/solicitud_especial.routes");
const conflicto_recurrenteRoutes = require("./src/routes/conflicto_recurrente.routes");  
const reporte_danoRoutes = require("./src/routes/reporte_dano.routes");
const mantenimientoRoutes = require("./src/routes/mantenimiento.routes");

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

// Rutas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/periodos", periodoRoutes);
app.use("/api/materias", materiaRoutes);
app.use("/api/espacios", espacioRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/solicitudes", solicitudRoutes);
app.use("/api/planes", plan_estudioRoutes);
app.use("/api/ubicaciones", ubicacionRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/solicitud_especial", solicitud_especialRoutes);
app.use("/api/conflicto_recurrente", conflicto_recurrenteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reporte", reporte_danoRoutes);
app.use("/api/mantenimiento", mantenimientoRoutes);

AppDataSource.initialize()
  .then(async () => {
    console.log("📦 Base de datos conectada");
    await runProcedures(); // 👈 aquí se migran tus procedures
  })
  .catch(err => console.error("❌ Error DB:", err));

module.exports = app;
