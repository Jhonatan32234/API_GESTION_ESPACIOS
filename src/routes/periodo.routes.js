const express = require("express");
const router = express.Router();
const periodoController = require("../controllers/periodo.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Periodos
 *   description: Gestión de periodos escolares
 */

/**
 * @swagger
 * /api/periodos:
 *   get:
 *     summary: Obtener todos los periodos
 *     tags: [Periodos]
 *     responses:
 *       200:
 *         description: Lista de periodos
 */
router.get("/", authMiddleware(["administrador", "docente"]), periodoController.getAll);

/**
 * @swagger
 * /api/periodos/{id}:
 *   get:
 *     summary: Obtener periodo por ID
 *     tags: [Periodos]
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
 *         description: No encontrado
 */
router.get("/:id", authMiddleware(["administrador", "docente"]), periodoController.getById);

/**
 * @swagger
 * /api/periodos:
 *   post:
 *     summary: Crear un nuevo periodo
 *     tags: [Periodos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *               anio:
 *                 type: integer
 *               tipo_periodo:
 *                 type: string
 *                 enum: [Enero-Abril, Mayo-Agosto, Septiembre-Diciembre]
 *     responses:
 *       201:
 *         description: Periodo creado
 */
router.post("/", authMiddleware(["administrador"]), periodoController.create);

/**
 * @swagger
 * /api/periodos/{id}:
 *   put:
 *     summary: Actualizar periodo
 *     tags: [Periodos]
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
 *     responses:
 *       200:
 *         description: Periodo actualizado
 */
router.put("/:id", authMiddleware(["administrador"]), periodoController.update);

/**
 * @swagger
 * /api/periodos/{id}:
 *   delete:
 *     summary: Marcar un periodo como inactivo
 *     tags: [Periodos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del periodo
 *     responses:
 *       200:
 *         description: Periodo marcado como inactivo
 *       404:
 *         description: No encontrado
 */
router.delete("/:id", authMiddleware(["administrador"]), periodoController.delete);

module.exports = router;
