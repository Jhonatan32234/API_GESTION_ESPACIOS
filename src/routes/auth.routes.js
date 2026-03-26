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

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cierra sesión y borra las cookies de token, rol e id
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Logout exitoso, cookies eliminadas
 */
router.post("/logout", usuarioController.logout);

/**
 * @swagger
 * /api/auth/register-admin:
 *   post:
 *     summary: Registro especial para el primer administrador del sistema
 *     description: Permite crear un administrador solo si no existe ninguno en la base de datos. Es un endpoint público para configuración inicial.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - email
 *               - contrasena
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               email:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       201:
 *         description: Administrador creado exitosamente
 *       400:
 *         description: Ya existe un administrador o error en los datos
 */
router.post("/register-admin", usuarioController.registerFirstAdmin);


module.exports = router;
