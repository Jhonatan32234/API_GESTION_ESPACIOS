const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reserva.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/reservas/eliminar:
 *   delete:
 *     summary: Eliminar reservas por fecha y rango horario
 *     tags: [Reservas]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-01"
 *               hora_inicio:
 *                 type: string
 *                 example: "08:00:00"
 *               hora_fin:
 *                 type: string
 *                 example: "10:00:00"
 *     responses:
 *       200:
 *         description: Reservas eliminadas correctamente
 *       500:
 *         description: Error al eliminar reservas
 */
router.delete("/eliminar", authMiddleware(["administrador"]), reservaController.eliminarReserva);

module.exports = router;
