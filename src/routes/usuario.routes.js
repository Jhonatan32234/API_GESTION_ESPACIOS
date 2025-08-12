const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario.controller");

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Lista todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado
 */
router.get("/", usuarioController.getAll);
router.post("/", usuarioController.create);

module.exports = router;
