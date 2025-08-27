const express = require("express");
const router = express.Router();
const notificacionController = require("../controllers/notificacion.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/notificacion/usuario/{usuario_id}:
 *   get:
 *     summary: Obtener notificaciones de un usuario
 *     tags: [Notificacion]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get("/usuario/:usuario_id", authMiddleware(["administrador","docente"]), notificacionController.getByUsuario);

/**
 * @swagger
 * /api/notificacion/usuario/{usuario_id}/no-leidas:
 *   get:
 *     summary: Obtener solo las notificaciones no leídas de un usuario
 *     tags: [Notificacion]
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de notificaciones no leídas
 */
router.get("/usuario/:usuario_id/no-leidas", notificacionController.getNoLeidas);


/**
 * @swagger
 * /api/notificacion:
 *   post:
 *     summary: Crear una nueva notificación
 *     tags: [Notificacion]
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
 *               - mensaje
 *             properties:
 *               usuario_id:
 *                 type: integer
 *               tipo:
 *                 type: string
 *               mensaje:
 *                 type: string
 *               relacion_id:
 *                 type: integer
 *               relacion_tipo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notificación creada
 */
router.post("/", authMiddleware(["administrador"]), notificacionController.create);

/**
 * @swagger
 * /api/notificacion/leida/{id}:
 *   put:
 *     summary: Marcar notificación como leída
 *     tags: [Notificacion]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 */
router.put("/leida/:id", authMiddleware(["administrador","docente"]), notificacionController.marcarLeida);

/**
 * @swagger
 * /api/notificacion/{id}:
 *   delete:
 *     summary: Eliminar una notificación
 *     tags: [Notificacion]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Notificación eliminada
 */
router.delete("/:id", authMiddleware(["administrador"]), notificacionController.delete);

module.exports = router;
