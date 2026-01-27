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
 *         activo:
 *           type: boolean
 *           default: true
 *           description: Indica si el periodo está activo
 */

/**
 * @swagger
 * /api/periodos:
 *   get:
 *     summary: Obtener todos los periodos activos/inactivos
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de periodos activos/inactivos
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
 * /api/periodos/activo:
 *   get:
 *     summary: Obtener el periodo activo actual
 *     description: Retorna el único periodo que está marcado como activo en el sistema.
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Periodo activo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Periodo'
 *       404:
 *         description: No hay periodo activo actualmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No hay periodo activo actualmente"
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/activo", authMiddleware(["administrador", "docente"]), periodoController.getPeriodoActivo);

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
 *             properties:
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-30"
 *     responses:
 *       201:
 *         description: Periodo creado exitosamente
 *       400:
 *         description: Error de validación (fechas solapadas, etc.)
 */
router.post("/", authMiddleware(["administrador"]), periodoController.create);

/**
 * @swagger
 * /api/periodos/{id}/activar:
 *   put:
 *     summary: Activar un periodo específico
 *     description: |
 *       Activa un periodo y desactiva automáticamente cualquier otro periodo activo.
 *       Validaciones:
 *       - No permite activar un periodo si ya hay otro activo (aunque se maneja internamente)
 *       - El periodo debe existir
 *       - Si el periodo ya está activo, retorna mensaje informativo
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del periodo a activar
 *     responses:
 *       200:
 *         description: Periodo activado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: |
 *           Error de validación:
 *           - Ya existe un periodo activo
 *           - Periodo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado - requiere rol de administrador
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id/activar", authMiddleware(["administrador"]), periodoController.activarPeriodo);

/**
 * @swagger
 * /api/periodos/{id}/desactivar:
 *   put:
 *     summary: Desactivar un periodo específico
 *     description: |
 *       Desactiva un periodo específico.
 *       Si el periodo ya está inactivo, retorna mensaje informativo.
 *     tags: [Periodos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del periodo a desactivar
 *     responses:
 *       200:
 *         description: Periodo desactivado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Periodo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado - requiere rol de administrador
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id/desactivar", authMiddleware(["administrador"]), periodoController.desactivarPeriodo);

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
 *                 example: "2024-01-01"
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-30"
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
 *     summary: Eliminar un periodo
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
 *         description: Periodo eliminado
 *       404:
 *         description: Periodo no encontrado
 */
router.delete("/:id", authMiddleware(["administrador"]), periodoController.delete);

module.exports = router;