const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario.controller");

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para autenticación y gestión de sesión
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión y genera un token JWT almacenado en cookie HttpOnly
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - contrasena
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@dominio.com
 *               contrasena:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login exitoso, se establece cookie HttpOnly con el token
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login", usuarioController.login);

module.exports = router;
