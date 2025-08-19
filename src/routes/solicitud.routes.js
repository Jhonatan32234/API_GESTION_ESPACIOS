// routes/solicitud.routes.js
const express = require("express");
const router = express.Router();
const solicitudController = require("../controllers/solicitud.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Solicitudes
 *   description: Gestión de solicitudes
 */

/**
 * @swagger
 * /api/solicitudes/normal:
 *   post:
 *     summary: Insertar una solicitud normal
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id:
 *                 type: integer
 *               espacio_id:
 *                 type: integer
 *               periodo_id:
 *                 type: integer
 *               materia_id:
 *                 type: integer
 *               grupo:
 *                 type: string
 *               motivo:
 *                 type: string
 *               cantidad_asistentes:
 *                 type: integer
 *               dias:
 *                 type: array
 *                 items:
 *                   type: integer
 *               hora_inicio:
 *                 type: string
 *               hora_fin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Solicitud insertada correctamente
 */
router.post("/normal", authMiddleware(["administrador", "docente"]), solicitudController.insertarSolicitudNormal);

/**
 * @swagger
 * /api/solicitudes/aprobar/{id}:
 *   post:
 *     summary: Aprobar una solicitud existente
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la solicitud a aprobar
 *     responses:
 *       200:
 *         description: Solicitud aprobada correctamente
 *       404:
 *         description: Solicitud no encontrada
 */
router.post("/aprobar/:id", authMiddleware(["administrador"]), solicitudController.aprobarSolicitud);


/**
 * @swagger
 * /api/solicitudes/calendario:
 *   get:
 *     summary: Obtener calendario de reservas (estilo tabla) por periodo
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del periodo escolar a filtrar
 *     responses:
 *       200:
 *         description: Calendario de reservas con info de materia, grupo y usuario
 *       400:
 *         description: Falta el parámetro periodo_id
 */

router.get("/calendario", authMiddleware(["administrador", "docente"]), solicitudController.getCalendario);


/**
 * @swagger
 * /api/solicitudes/semanal:
 *   get:
 *     summary: Obtener solicitudes agrupadas por semanas de un mes
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del periodo escolar a filtrar
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mes en formato numérico (1-12)
 *       - in: query
 *         name: anio
 *         required: true
 *         schema:
 *           type: integer
 *         description: Año en formato numérico (ej. 2025)
 *     responses:
 *       200:
 *         description: Solicitudes organizadas por semanas del mes
 *       400:
 *         description: Falta algún parámetro requerido
 */
router.get("/semanal", authMiddleware(["administrador", "docente"]), solicitudController.getSolicitudesPorSemana);

/**
 * @swagger
 * /api/solicitudes/:
 *   get:
 *     summary: Obtener todas las solicitudes
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   solicitud_id:
 *                     type: integer
 *                   usuario:
 *                     type: string
 *                   espacio:
 *                     type: string
 *                   ubicacion:
 *                     type: string
 *                   periodo:
 *                     type: string
 *                   materia:
 *                     type: string
 *                   plan_estudio:
 *                     type: string
 *                   grupo:
 *                     type: string
 *                   motivo:
 *                     type: string
 *                   estado:
 *                     type: string
 */
router.get("/", authMiddleware(["administrador", "docente"]),  solicitudController.getSolicitudes);



module.exports = router;
