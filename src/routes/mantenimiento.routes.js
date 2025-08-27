const express = require("express");
const router = express.Router();
const mantenimientoController = require("../controllers/mantenimiento.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Mantenimiento
 *   description: Gestión de mantenimientos en espacios educativos
 */

/**
 * @swagger
 * /api/mantenimiento:
 *   post:
 *     summary: Insertar un mantenimiento para un reporte
 *     tags: [Mantenimiento]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reporte_id
 *               - descripcion
 *               - fecha_programada
 *               - usuario_id
 *               - tipo
 *             properties:
 *               reporte_id:
 *                 type: integer
 *                 description: ID del reporte asociado
 *               descripcion:
 *                 type: string
 *                 description: Descripción del mantenimiento
 *               fecha_programada:
 *                 type: string
 *                 format: date
 *                 description: Fecha programada del mantenimiento
 *               usuario_id:
 *                 type: integer
 *                 description: ID del usuario responsable
 *               tipo:
 *                 type: string
 *                 description: Tipo de mantenimiento
 *     responses:
 *       201:
 *         description: Mantenimiento insertado correctamente
 *       400:
 *         description: Error en los datos enviados
 */
router.post("/", authMiddleware(["administrador"]), mantenimientoController.insertarMantenimiento);

/**
 * @swagger
 * /api/mantenimiento/completar:
 *   post:
 *     summary: Completar un mantenimiento existente
 *     tags: [Mantenimiento]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mantenimiento_id
 *               - fecha_completado
 *               - costo
 *             properties:
 *               mantenimiento_id:
 *                 type: integer
 *                 description: ID del mantenimiento a completar
 *               fecha_completado:
 *                 type: string
 *                 format: date
 *                 description: Fecha en la que se completó
 *               costo:
 *                 type: number
 *                 format: decimal
 *                 description: Costo del mantenimiento
 *     responses:
 *       200:
 *         description: Mantenimiento completado correctamente
 *       400:
 *         description: Faltan datos obligatorios
 */
router.post("/completar", authMiddleware(["administrador"]), mantenimientoController.completarMantenimiento);

module.exports = router;



/**
 * @swagger
 * /api/mantenimiento/cancelar/{mantenimiento_id}:
 *   post:
 *     summary: Cancelar un mantenimiento existente
 *     tags: [Mantenimiento]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: mantenimiento_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del mantenimiento a cancelar
 *     responses:
 *       200:
 *         description: Mantenimiento cancelado correctamente
 *       400:
 *         description: Falta el ID del mantenimiento
 */
router.post("/cancelar/:mantenimiento_id", authMiddleware(["administrador"]), mantenimientoController.cancelarMantenimiento);



/**
 * @swagger
 * /api/mantenimiento/pendientes:
 *   get:
 *     summary: Obtener mantenimientos pendientes o en proceso
 *     tags: [Mantenimiento]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de mantenimientos pendientes o en proceso
 */
router.get("/pendientes", authMiddleware(["administrador","docente"]), mantenimientoController.getPendientesEnProceso);

/**
 * @swagger
 * /api/mantenimiento/completados:
 *   get:
 *     summary: Obtener mantenimientos completados
 *     tags: [Mantenimiento]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de mantenimientos completados
 */
router.get("/completados", authMiddleware(["administrador","docente"]), mantenimientoController.getCompletados);

/**
 * @swagger
 * /api/mantenimiento/usuario/{usuarioId}:
 *   get:
 *     summary: Obtener mantenimientos registrados por un usuario específico
 *     tags: [Mantenimiento]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de mantenimientos del usuario
 */
router.get("/usuario/:usuarioId", authMiddleware(["administrador","docente"]), mantenimientoController.getPorUsuario);

module.exports = router;
