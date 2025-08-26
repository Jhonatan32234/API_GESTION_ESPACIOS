const express = require("express");
const router = express.Router();
const ubicacionController = require("../controllers/ubicacion.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Ubicaciones
 *   description: Gestión de ubicaciones (CRUD)
 */

/**
 * @swagger
 * /api/ubicaciones:
 *   get:
 *     summary: Obtener todas las ubicaciones
 *     tags: [Ubicaciones]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de ubicaciones
 */
router.get("/", authMiddleware(["administrador", "docente"]), ubicacionController.getAll);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   get:
 *     summary: Obtener ubicación por ID
 *     tags: [Ubicaciones]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la ubicación
 *     responses:
 *       200:
 *         description: Datos de la ubicación
 *       404:
 *         description: Ubicación no encontrada
 */
router.get("/:id", authMiddleware(["administrador", "docente"]), ubicacionController.getById);

/**
 * @swagger
 * /api/ubicaciones:
 *   post:
 *     summary: Crear nueva ubicación
 *     tags: [Ubicaciones]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ubicacion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ubicación creada
 */
router.post("/", authMiddleware(["administrador"]), ubicacionController.create);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   put:
 *     summary: Actualizar ubicación
 *     tags: [Ubicaciones]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la ubicación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ubicacion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ubicación actualizada
 */
router.put("/:id", authMiddleware(["administrador"]), ubicacionController.update);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   delete:
 *     summary: Eliminar ubicación
 *     tags: [Ubicaciones]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la ubicación
 *     responses:
 *       204:
 *         description: Ubicación eliminada
 */
router.delete("/:id", authMiddleware(["administrador"]), ubicacionController.delete);

module.exports = router;
