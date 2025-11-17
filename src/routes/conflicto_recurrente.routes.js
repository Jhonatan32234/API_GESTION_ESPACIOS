const express = require("express");
const router = express.Router();
const conflictoController = require("../controllers/conflicto_recurrente.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Conflictos Recurrentes
 *   description: Gestión de conflictos recurrentes
 */

/**
 * @swagger
 * /api/conflicto_recurrente:
 *   get:
 *     summary: Obtener todos los conflictos recurrentes
 *     tags: [Conflictos Recurrentes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de conflictos
 */
router.get("/", authMiddleware(["administrador", "docente"]), conflictoController.getAll);

/**
 * @swagger
 * /api/conflicto_recurrente/resolver:
 *   post:
 *     summary: Resolver un conflicto recurrente entre solicitudes
 *     tags: [Conflictos Recurrentes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conflicto_id
 *               - ganador_solicitud_id
 *               - admin_id
 *             properties:
 *               conflicto_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID del conflicto a resolver
 *               ganador_solicitud_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID de la solicitud ganadora (debe ser una de las dos en conflicto)
 *               admin_id:
 *                 type: integer
 *                 example: 2
 *                 description: ID del administrador que resuelve el conflicto
 *     responses:
 *       200:
 *         description: Conflicto resuelto exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Conflicto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/resolver", authMiddleware(["administrador"]), conflictoController.resolverConflicto);

/**
 * @swagger
 * /api/conflicto_recurrente/pendientes:
 *   get:
 *     summary: Obtener todos los conflictos pendientes
 *     tags: [Conflictos Recurrentes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de conflictos pendientes
 *       500:
 *         description: Error interno del servidor
 */
router.get("/pendientes", authMiddleware(["administrador"]), conflictoController.obtenerConflictosPendientes);


/**
 * @swagger
 * /api/conflicto_recurrente/{id}:
 *   get:
 *     summary: Obtener un conflicto específico por ID
 *     tags: [Conflictos Recurrentes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del conflicto
 *     responses:
 *       200:
 *         description: Datos del conflicto
 *       404:
 *         description: Conflicto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:id", authMiddleware(["administrador"]), conflictoController.getById);


module.exports = router;