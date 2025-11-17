const express = require("express");
const router = express.Router();
const softwareController = require("../controllers/software.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Software
 *   description: Gestión de software (CRUD)
 */

/**
 * @swagger
 * /api/software:
 *   get:
 *     summary: Obtener todo el software
 *     tags: [Software]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de software
 */
router.get("/", authMiddleware(["administrador", "docente"]), softwareController.getAll);

/**
 * @swagger
 * /api/software/{id}:
 *   get:
 *     summary: Obtener software por ID
 *     tags: [Software]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del software
 *     responses:
 *       200:
 *         description: Datos del software
 *       404:
 *         description: Software no encontrado
 */
router.get("/:id", authMiddleware(["administrador", "docente"]), softwareController.getById);

/**
 * @swagger
 * /api/software:
 *   post:
 *     summary: Crear software
 *     tags: [Software]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               version:
 *                 type: string
 *               asignatura_requerida:
 *                 type: string
 *               fecha_instalacion:
 *                 type: string
 *                 format: date
 *               inventario_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Software creado
 */
router.post("/", authMiddleware(["administrador"]), softwareController.create);

/**
 * @swagger
 * /api/software/inventario/{inventario_id}:
 *   get:
 *     summary: Obtener software por ID de inventario
 *     tags: [Software]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: inventario_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del inventario
 *     responses:
 *       200:
 *         description: Lista de software asociado al inventario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventario_id:
 *                   type: integer
 *                   example: 1
 *                 total_software:
 *                   type: integer
 *                   example: 3
 *                 software:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       software_id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       version:
 *                         type: string
 *                       asignatura_requerida:
 *                         type: string
 *                       fecha_instalacion:
 *                         type: string
 *                         format: date
 *                       fecha_actualizacion:
 *                         type: string
 *                         format: date
 *                       inventario_id:
 *                         type: integer
 *                       estado:
 *                         type: string
 *                       marca:
 *                         type: string
 *                       modelo:
 *                         type: string
 *                       patrimonio:
 *                         type: string
 *                       observaciones:
 *                         type: string
 *                       nombre_elemento:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *       404:
 *         description: No se encontró software para este inventario
 *       400:
 *         description: Parámetro inventario_id requerido
 */
router.get("/inventario/:inventario_id", authMiddleware(["administrador", "docente"]), softwareController.getByInventarioId);

/**
 * @swagger
 * /api/software/{id}:
 *   put:
 *     summary: Actualizar software
 *     tags: [Software]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del software
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               version:
 *                 type: string
 *               asignatura_requerida:
 *                 type: string
 *               fecha_actualizacion:
 *                 type: string
 *                 format: date
 *               inventario_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Software actualizado
 */
router.put("/:id", authMiddleware(["administrador"]), softwareController.update);

/**
 * @swagger
 * /api/software/{id}:
 *   delete:
 *     summary: Eliminar software
 *     tags: [Software]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del software
 *     responses:
 *       204:
 *         description: Software eliminado
 */
router.delete("/:id", authMiddleware(["administrador"]), softwareController.delete);

module.exports = router;
