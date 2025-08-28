const express = require("express");
const router = express.Router();
const reportedanocontroller = require("../controllers/reporte_dano.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Reporte de Daño
 *   description: Gestión de reportes de daño
 */

/**
 * @swagger
 * /api/reporte:
 *   post:
 *     summary: Insertar un nuevo reporte de daño
 *     tags: [Reporte de Daño]
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
 *               inventario_id:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reporte insertado correctamente
 */
router.post("/", authMiddleware(["administrador", "docente"]), reportedanocontroller.insertarReporte);

/**
 * @swagger
 * /api/reporte/pendientes:
 *   get:
 *     summary: Obtener reportes pendientes y en proceso
 *     tags: [Reporte de Daño]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes pendientes o en proceso
 */
router.get("/pendientes", authMiddleware(["administrador", "docente"]), reportedanocontroller.getPendientesEnProceso);

/**
 * @swagger
 * /api/reporte/reparados:
 *   get:
 *     summary: Obtener reportes reparados
 *     tags: [Reporte de Daño]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes que han sido reparados
 */
router.get("/reparados", authMiddleware(["administrador", "docente"]), reportedanocontroller.getReparados);

/**
 * @swagger
 * /api/reporte/usuario/{id}:
 *   get:
 *     summary: Obtener todos los reportes de un usuario
 *     tags: [Reporte de Daño]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de reportes del usuario especificado
 */
router.get("/usuario/:id", authMiddleware(["administrador", "docente"]), reportedanocontroller.getPorUsuario);


/**
 * @swagger
 * /api/reporte/rechazar/{reporteId}:
 *   post:
 *     summary: Rechazar un reporte de daño
 *     tags: [Reporte de Daño]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reporteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte a rechazar
 *     responses:
 *       200:
 *         description: Reporte rechazado correctamente
 *       500:
 *         description: Error al rechazar el reporte
 */
router.post("/rechazar/:reporteId", authMiddleware(["administrador"]), reportedanocontroller.rechazarReporte);


/**
 * @swagger
 * /api/reporte/{reporteId}:
 *   put:
 *     summary: Actualizar un reporte de daño
 *     tags: [Reporte de Daño]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reporteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_proceso, reparado]
 *               usuario_id:
 *                 type: integer
 *               inventario_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reporte actualizado correctamente
 *       400:
 *         description: No se enviaron campos para actualizar
 *       500:
 *         description: Error al actualizar el reporte
 */
router.put("/:reporteId", authMiddleware(["administrador", "docente"]), reportedanocontroller.actualizarReporte);

/**
 * @swagger
 * /api/reporte/proceso/{reporteId}:
 *   post:
 *     summary: Marcar un reporte como en proceso y notificar al usuario
 *     tags: [Reporte de Daño]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reporteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte marcado en proceso y usuario notificado
 *       500:
 *         description: Error interno
 */
router.post("/proceso/:reporteId", authMiddleware(["administrador"]), reportedanocontroller.marcarEnProceso);

/**
 * @swagger
 * /api/reporte/reparado/{reporteId}:
 *   post:
 *     summary: Marcar un reporte como reparado y notificar al usuario
 *     tags: [Reporte de Daño]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reporteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte marcado como reparado y usuario notificado
 *       500:
 *         description: Error interno
 */
router.post("/reparado/:reporteId", authMiddleware(["administrador"]), reportedanocontroller.marcarReparado);

module.exports = router;
