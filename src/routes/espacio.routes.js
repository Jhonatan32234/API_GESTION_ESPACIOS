const express = require("express");
const router = express.Router();
const espacioController = require("../controllers/espacio.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Espacios
 *   description: Gestión de espacios
 */

/**
 * @swagger
 * /api/espacios:
 *   get:
 *     summary: Obtener todos los espacios
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de espacios
 */
router.get("/", authMiddleware(["administrador"]), espacioController.getAll);

/**
 * @swagger
 * /api/espacios/{id}:
 *   get:
 *     summary: Obtener espacio por ID
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *     responses:
 *       200:
 *         description: Datos del espacio
 *       404:
 *         description: Espacio no encontrado
 */
router.get("/:id", authMiddleware(["administrador"]), espacioController.getById);

/**
 * @swagger
 * /api/espacios:
 *   post:
 *     summary: Crear un espacio
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo
 *               - categoria
 *               - ubicacion
 *               - capacidad
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [aula, laboratorio, sala_reuniones]
 *               categoria:
 *                 type: string
 *                 enum: [generica, equipada, tecnica, laboratorio]
 *               ubicacion:
 *                 type: string
 *               capacidad:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               disponible:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Espacio creado
 */
router.post("/", authMiddleware(["administrador"]), espacioController.create);

/**
 * @swagger
 * /api/espacios/{id}:
 *   put:
 *     summary: Actualizar un espacio
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [aula, laboratorio, sala_reuniones]
 *               categoria:
 *                 type: string
 *                 enum: [generica, equipada, tecnica, laboratorio]
 *               ubicacion:
 *                 type: string
 *               capacidad:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               disponible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Espacio actualizado
 */
router.put("/:id", authMiddleware(["administrador"]), espacioController.update);

/**
 * @swagger
 * /api/espacios/{id}:
 *   delete:
 *     summary: Eliminar un espacio
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Espacio eliminado
 */
router.delete("/:id", authMiddleware(["administrador"]), espacioController.delete);

module.exports = router;
