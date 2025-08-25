const express = require("express");
const router = express.Router();
const solicitudEspecialController = require("../controllers/solicitud_especial.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: SolicitudEspecial
 *   description: Solicitudes especiales (eventos puntuales)
 */

/**
 * @swagger
 * /api/solicitud_especial:
 *   post:
 *     summary: Registrar una nueva solicitud especial en estado pendiente
 *     tags: [SolicitudEspecial]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_id
 *               - espacio_id
 *               - fecha
 *               - motivo
 *               - cantidad_asistentes
 *               - hora_inicio
 *               - hora_fin
 *             properties:
 *               usuario_id:
 *                 type: integer
 *               espacio_id:
 *                 type: integer
 *               fecha:
 *                 type: string
 *                 format: date
 *               motivo:
 *                 type: string
 *               cantidad_asistentes:
 *                 type: integer
 *               hora_inicio:
 *                 type: string
 *                 example: "08:00:00"
 *               hora_fin:
 *                 type: string
 *                 example: "10:00:00"
 *     responses:
 *       201:
 *         description: Solicitud especial registrada correctamente
 *       500:
 *         description: Error al registrar la solicitud especial
 */
router.post("/", authMiddleware(["administrador", "docente"]), solicitudEspecialController.insertar);


/**
 * @swagger
 * /api/solicitud_especial/aprobar/{solicitud_especial_id}:
 *   post:
 *     summary: Aprobar una solicitud especial y notificar a usuarios afectados
 *     tags: [SolicitudEspecial]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_especial_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la solicitud especial a aprobar
 *     responses:
 *       200:
 *         description: Solicitud especial aprobada y usuarios notificados con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 emailsNotificados:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Falta el parámetro solicitud_especial_id
 *       500:
 *         description: Error interno del servidor
 */
router.post("/aprobar/:solicitud_especial_id", authMiddleware(["administrador"]), solicitudEspecialController.aprobar);


/**
 * @swagger
 * /api/solicitud_especial/rechazar/{solicitud_especial_id}:
 *   post:
 *     summary: Rechazar una solicitud especial y notificar al usuario
 *     tags: [SolicitudEspecial]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_especial_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la solicitud especial a rechazar
 *     responses:
 *       200:
 *         description: Solicitud especial rechazada y usuario notificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 resultado:
 *                   type: array
 *       400:
 *         description: Falta el parámetro solicitud_especial_id
 *       500:
 *         description: Error interno del servidor
 */
router.post("/rechazar/:solicitud_especial_id", authMiddleware(["administrador"]), solicitudEspecialController.rechazar);


/**
 * @swagger
 * /api/solicitud_especial/aprobadas:
 *   get:
 *     summary: Listar solicitudes especiales aprobadas
 *     description: Obtiene todas las solicitudes especiales aprobadas. Solo pueden acceder usuarios con rol **administrador** o **docente**.
 *     tags: [SolicitudEspecial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes aprobadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12
 *                   usuario_id:
 *                     type: integer
 *                     example: 3
 *                   espacio_id:
 *                     type: integer
 *                     example: 5
 *                   fecha:
 *                     type: string
 *                     format: date
 *                     example: 2025-08-23
 *                   motivo:
 *                     type: string
 *                     example: "Conferencia académica"
 *                   estado:
 *                     type: string
 *                     example: "aprobada"
 */
router.get("/aprobadas", authMiddleware(["administrador", "docente"]), solicitudEspecialController.listarAprobadas);

/**
 * @swagger
 * /api/solicitud_especial/usuario/{usuario_id}/:
 *   get:
 *     summary: Obtener todas las solicitudes especiales de un usuario
 *     tags: [SolicitudEspecial]
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
 *         description: Lista de solicitudes especiales del usuario
 */
router.get("/usuario/:usuario_id", authMiddleware(["administrador", "docente"]), solicitudEspecialController.getSolicitudesEspecialesPorUsuario);



/**
 * @swagger
 * /api/solicitud_especial/pen-rec:
 *   get:
 *     summary: Listar solicitudes especiales pendientes o rechazadas
 *     description: Obtiene todas las solicitudes especiales que están en estado **pendiente** o **rechazada**. Solo puede acceder el rol **administrador**.
 *     tags: [SolicitudEspecial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes pendientes o rechazadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 8
 *                   usuario_id:
 *                     type: integer
 *                     example: 4
 *                   espacio_id:
 *                     type: integer
 *                     example: 7
 *                   fecha:
 *                     type: string
 *                     format: date
 *                     example: 2025-09-01
 *                   motivo:
 *                     type: string
 *                     example: "Reunión administrativa"
 *                   estado:
 *                     type: string
 *                     example: "pendiente"
 */
router.get("/pen-rec", authMiddleware(["administrador","docente"]), solicitudEspecialController.listarPendRech);


module.exports = router;
