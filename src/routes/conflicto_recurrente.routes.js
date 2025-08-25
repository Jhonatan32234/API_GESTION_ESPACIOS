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
 * /api/conflicto_recurrente/{id}:
 *   get:
 *     summary: Obtener conflicto recurrente por ID
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
 */
router.get("/:id", authMiddleware(["administrador", "docente"]), conflictoController.getById);

/**
 * @swagger
 * /api/conflicto_recurrente:
 *   post:
 *     summary: Crear un conflicto recurrente
 *     tags: [Conflictos Recurrentes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConflictoRecurrente'
 *     responses:
 *       201:
 *         description: Conflicto creado
 */
router.post("/", authMiddleware(["administrador"]), conflictoController.create);

/**
 * @swagger
 * /api/conflicto_recurrente/{id}:
 *   put:
 *     summary: Actualizar un conflicto recurrente
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConflictoRecurrente'
 *     responses:
 *       200:
 *         description: Conflicto actualizado
 */
router.put("/:id", authMiddleware(["administrador"]), conflictoController.update);

/**
 * @swagger
 * /api/conflicto_recurrente/{id}:
 *   delete:
 *     summary: Eliminar conflicto recurrente
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
 *       204:
 *         description: Conflicto eliminado
 */
router.delete("/:id", authMiddleware(["administrador"]), conflictoController.delete);

module.exports = router;
