const express = require("express");
const router = express.Router();
const espacioInventarioController = require("../controllers/espacio_inventario.controller.js");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Espacio_Inventario
 *   description: Gestión de asignaciones entre espacios e inventario
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AsignacionInventario:
 *       type: object
 *       properties:
 *         espacio_inventario_id:
 *           type: integer
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *         activo:
 *           type: boolean
 *         inventario:
 *           type: object
 *           properties:
 *             inventario_id:
 *               type: integer
 *             cantidad:
 *               type: integer
 *             marca:
 *               type: string
 *             modelo:
 *               type: string
 *             patrimonio:
 *               type: string
 *             estado:
 *               type: string
 *             catalogo_elemento:
 *               $ref: '#/components/schemas/CatalogoElemento'
 *         espacio:
 *           type: object
 *           properties:
 *             espacio_id:
 *               type: integer
 *             nombre:
 *               type: string
 */

/**
 * @swagger
 * /api/espacio_inventario/espacio/{espacioId}:
 *   get:
 *     summary: Obtener inventario asignado a un espacio
 *     tags: [Espacio_Inventario]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: espacioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *     responses:
 *       200:
 *         description: Lista de inventario asignado al espacio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AsignacionInventario'
 */
router.get("/espacio/:espacioId", authMiddleware(["administrador", "docente"]), espacioInventarioController.getByEspacio);

/**
 * @swagger
 * /api/espacio_inventario/inventario/{inventarioId}:
 *   get:
 *     summary: Obtener espacios asignados a un inventario
 *     tags: [Espacio_Inventario]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: inventarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del inventario
 *     responses:
 *       200:
 *         description: Lista de espacios asignados al inventario
 */
router.get("/inventario/:inventarioId", authMiddleware(["administrador", "docente"]), espacioInventarioController.getByInventario);

/**
 * @swagger
 * /api/espacio_inventario/disponible:
 *   get:
 *     summary: Obtener inventario disponible (sin asignar)
 *     tags: [Espacio_Inventario]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de inventario disponible
 */
router.get("/disponible", authMiddleware(["administrador", "docente"]), espacioInventarioController.getInventarioDisponible);

/**
 * @swagger
 * /api/espacio_inventario/asignar:
 *   post:
 *     summary: Asignar inventario a un espacio
 *     tags: [Espacio_Inventario]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - espacioId
 *               - inventarioId
 *             properties:
 *               espacioId:
 *                 type: integer
 *                 example: 1
 *               inventarioId:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Inventario asignado exitosamente
 */
router.post("/asignar", authMiddleware(["administrador"]), espacioInventarioController.asignar);

/**
 * @swagger
 * /api/espacio_inventario/reasignar/{espacioInventarioId}:
 *   put:
 *     summary: Reasignar inventario a otro espacio
 *     tags: [Espacio_Inventario]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: espacioInventarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación actual
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nuevoEspacioId
 *             properties:
 *               nuevoEspacioId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Inventario reasignado exitosamente
 */
router.put("/reasignar/:espacioInventarioId", authMiddleware(["administrador"]), espacioInventarioController.reasignar);

/**
 * @swagger
 * /api/espacio_inventario/quitar/{espacioInventarioId}:
 *   delete:
 *     summary: Quitar inventario de un espacio (desasignar)
 *     tags: [Espacio_Inventario]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: espacioInventarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación a eliminar
 *     responses:
 *       200:
 *         description: Inventario removido exitosamente
 */
router.delete("/quitar/:espacioInventarioId", authMiddleware(["administrador"]), espacioInventarioController.quitar);

/**
 * @swagger
 * /api/espacio_inventario/espacio/{espacioId}/quitar-todos:
 *   delete:
 *     summary: Quitar todo el inventario de un espacio
 *     tags: [Espacio_Inventario]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: espacioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *     responses:
 *       200:
 *         description: Todo el inventario removido del espacio
 */
router.delete("/espacio/:espacioId/quitar-todos", authMiddleware(["administrador"]), espacioInventarioController.quitarTodosDeEspacio);

module.exports = router;