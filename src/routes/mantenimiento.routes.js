const express = require("express");
const router = express.Router();
const mantenimientoController = require("../controllers/mantenimiento.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Mantenimiento
 *   description: Gestión de mantenimiento
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
 *             properties:
 *               usuario_mantenimiento_id:
 *                 type: integer
 *               reporte_id:
 *                 type: integer
 *               tipo:
 *                 type: string
 *               fecha_programada:
 *                 type: string
 *                 format: date
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mantenimiento insertado correctamente
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
 *             properties:
 *               mantenimiento_id:
 *                 type: integer
 *               fecha_completado:
 *                 type: string
 *                 format: date
 *               costo:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Mantenimiento completado correctamente
 */
router.post("/completar", authMiddleware(["administrador"]), mantenimientoController.completarMantenimiento);

module.exports = router;
