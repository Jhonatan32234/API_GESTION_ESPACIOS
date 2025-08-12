const express = require("express");
const router = express.Router();

const usuarioRoutes = require("./usuario.routes");

router.use("/usuarios", usuarioRoutes);

module.exports = router;
