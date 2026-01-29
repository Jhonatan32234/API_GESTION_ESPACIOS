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
 * /api/solicitudes/horario/{espacio_id}:
 *   get:
 *     summary: Obtener horario de reservas de un espacio
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: espacio_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *     responses:
 *       200:
 *         description: Horario del espacio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 espacio_id:
 *                   type: integer
 *                 periodo_id:
 *                   type: integer
 *                 periodo_activo:
 *                   type: string
 *                 lunes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hora:
 *                         type: string
 *                         example: "08:00-09:00"
 *                       grupo:
 *                         type: string
 *                       materia:
 *                         type: string
 *                
 */
router.get("/horario/:espacio_id", authMiddleware(["administrador", "docente"]), solicitudController.obtenerHorarioEspacio);

/**
 * @swagger
 * /api/solicitudes/usuario/{usuario_id}:
 *   get:
 *     summary: Obtener todas las solicitudes normales de un usuario
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de solicitudes normales del usuario
 */
router.get("/usuario/:usuario_id", authMiddleware(["administrador", "docente"]), solicitudController.getSolicitudesNormalesPorUsuario);


/**
 * @swagger
 * /api/solicitudes/aprobar/{solicitud_id}/{usuario_id}:
 *   post:
 *     summary: Aprobar una solicitud existente
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la solicitud a aprobar
 *       - in: path
 *         name: usuario_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario que aprueba la solicitud
 *     responses:
 *       200:
 *         description: Solicitud aprobada correctamente
 *       404:
 *         description: Solicitud no encontrada
 */
router.post("/aprobar/:solicitud_id/:usuario_id", authMiddleware(["administrador"]), solicitudController.aprobarSolicitud);


/**
 * @swagger
 * /api/solicitudes/rechazar/{id}:
 *   put:
 *     summary: Rechazar una solicitud normal
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la solicitud a rechazar
 *     responses:
 *       200:
 *         description: Solicitud rechazada correctamente
 *       500:
 *         description: Error al procesar la solicitud
 */
router.put("/rechazar/:id", authMiddleware(["administrador"]), solicitudController.rechazarNormal);

/**
 * swagger
 * /api/solicitudes/calendario:
 *   get:
 *     summary: Obtener calendario de reservas (estilo tabla) por espacio y periodo
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: espacio_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio a consultar
 *       - in: query
 *         name: periodo_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID del periodo escolar (opcional, usa el vigente por defecto)
 *     responses:
 *       200:
 *         description: Calendario de reservas con info de materia, grupo y usuario
 *       400:
 *         description: Falta el parámetro espacio_id
 */

//router.get("/calendario", authMiddleware(["administrador", "docente"]), solicitudController.getCalendario);


/**
 * swagger
 * /api/solicitudes/semanal:
 *   get:
 *     summary: Obtener solicitudes aprobadas agrupadas por semanas de un mes específico
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Mes en formato numérico (1-12)
 *       - in: query
 *         name: espacio_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio específico a filtrar
 *     responses:
 *       200:
 *         description: Solicitudes aprobadas organizadas por semanas del mes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mes:
 *                   type: integer
 *                   description: Mes consultado
 *                 anio:
 *                   type: integer
 *                   description: Año actual automático
 *                 espacio_id:
 *                   type: integer
 *                   description: ID del espacio filtrado (o 'todos' si no se filtró)
 *                 espacio_nombre:
 *                   type: string
 *                   description: Nombre del espacio filtrado
 *                 semanas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       semana:
 *                         type: string
 *                         description: Número de semana en el mes
 *                       lunes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             diaMes:
 *                               type: integer
 *                             hora:
 *                               type: integer
 *                             detalle:
 *                               type: string
 *                             tipo:
 *                               type: string
 *                               enum: [normal, especial]
 *                             espacio_id:
 *                               type: integer
 *                             espacio_nombre:
 *                               type: string
 *                       martes:
 *                         type: array
 *                       miercoles:
 *                         type: array
 *                       jueves:
 *                         type: array
 *                       viernes:
 *                         type: array
 *                       sabado:
 *                         type: array
 *                       domingo:
 *                         type: array
 *       400:
 *         description: Parámetro mes faltante o inválido
 */
//router.get("/semanal", authMiddleware(["administrador", "docente"]), solicitudController.getSolicitudesPorSemana);

/**
 * @swagger
 * /api/solicitudes/aprobadas:
 *   get:
 *     summary: Obtener todas las solicitudes aprobadas
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
router.get("/aprobadas", authMiddleware(["administrador", "docente"]),  solicitudController.getSolicitudes);

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
 */
router.get("/", authMiddleware(["administrador", "docente"]), solicitudController.getAll);


module.exports = router;
