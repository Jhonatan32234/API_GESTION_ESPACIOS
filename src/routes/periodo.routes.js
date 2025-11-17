const express = require("express");
const router = express.Router();
const periodoController = require("../controllers/periodo.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Periodos
 *   description: Gestión de periodos académicos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Periodo:
 *       type: object
 *       required:
 *         - fecha_inicio
 *         - fecha_fin
 *         - tipo_periodo
 *       properties:
 *         periodo_id:
 *           type: integer
 *           description: ID autoincremental
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           description: Fecha de inicio del periodo
 *         fecha_fin:
 *           type: string
 *           format: date
 *           description: Fecha de fin del periodo
 *         tipo_periodo:
 *           type: string
 *           enum: [Enero-Abril, Mayo-Agosto, Septiembre-Diciembre, Verano, Invierno]
 *           description: Tipo de periodo académico
 *         activo:
 *           type: boolean
 *           default: true
 *           description: Indica si el periodo está activo
 */

/**
 * @swagger
 * /api/periodos:
 *   get:
 *     summary: Obtener todos los periodos activos
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de periodos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Periodo'
 */
router.get("/", authMiddleware(["administrador", "docente"]), periodoController.getAll);

/**
 * @swagger
 * /api/periodos/{id}:
 *   get:
 *     summary: Obtener periodo por ID
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del periodo
 *     responses:
 *       200:
 *         description: Datos del periodo
 *       404:
 *         description: Periodo no encontrado
 */
router.get("/:id", authMiddleware(["administrador", "docente"]), periodoController.getById);

/**
 * @swagger
 * /api/periodos:
 *   post:
 *     summary: Crear un nuevo periodo
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_inicio
 *               - fecha_fin
 *               - tipo_periodo
 *             properties:
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: "aaaa-mm-dd"
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 example: "aaaa-mm-dd"
 *               tipo_periodo:
 *                 type: string
 *                 enum: [Enero-Abril, Mayo-Agosto, Septiembre-Diciembre]
 *                 example: "Enero-Abril"
 *     responses:
 *       201:
 *         description: Periodo creado exitosamente
 *       400:
 *         description: Error de validación (fechas solapadas, etc.)
 */
router.post("/", authMiddleware(["administrador"]), periodoController.create);

/**
 * @swagger
 * /api/periodos/{id}:
 *   put:
 *     summary: Actualizar periodo
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del periodo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: "aaaa-mm-dd"
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 example: "aaaa-mm-dd"
 *               tipo_periodo:
 *                 type: string
 *                 enum: [Enero-Abril, Mayo-Agosto, Septiembre-Diciembre, Verano, Invierno]
 *     responses:
 *       200:
 *         description: Periodo actualizado
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Periodo no encontrado
 */
router.put("/:id", authMiddleware(["administrador"]), periodoController.update);

/**
 * @swagger
 * /api/periodos/{id}:
 *   delete:
 *     summary: Marcar un periodo como inactivo
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del periodo
 *     responses:
 *       200:
 *         description: Periodo marcado como inactivo
 *       404:
 *         description: Periodo no encontrado
 */
router.delete("/:id", authMiddleware(["administrador"]), periodoController.delete);

module.exports = router;