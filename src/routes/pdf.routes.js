const express = require("express");
const router = express.Router();
const pdfController = require("../controllers/pdf.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: PDF
 *   description: Generación de documentos PDF
 */

/**
 * @swagger
 * /api/pdf/reserva/{reservaId}:
 *   get:
 *     summary: Generar comprobante de reserva en PDF
 *     tags: [PDF]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/reserva/:reservaId", authMiddleware(["administrador", "docente"]), pdfController.generarComprobanteReserva);

/**
 * @swagger
 * /api/pdf/usuario/{usuarioId}:
 *   get:
 *     summary: Generar reporte de usuario en PDF
 *     tags: [PDF]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/usuario/:usuarioId", authMiddleware(["administrador"]), pdfController.generarReporteUsuario);

/**
 * @swagger
 * /api/pdf/generar:
 *   post:
 *     summary: Generar PDF personalizado
 *     tags: [PDF]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *             properties:
 *               template:
 *                 type: string
 *                 description: Nombre de la plantilla a usar
 *               data:
 *                 type: object
 *                 description: Datos para la plantilla
 *               filename:
 *                 type: string
 *                 description: Nombre del archivo PDF
 *               download:
 *                 type: boolean
 *                 description: Forzar descarga en lugar de visualización
 *     responses:
 *       200:
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post("/generar", authMiddleware(["administrador"]), pdfController.generarPDFPersonalizado);

module.exports = router;