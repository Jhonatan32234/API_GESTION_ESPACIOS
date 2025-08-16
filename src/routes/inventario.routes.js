const express = require("express");
const router = express.Router();
const inventarioController = require("../controllers/inventario.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Inventario
 *   description: Gestión de inventario de espacios
 */

/**
 * @swagger
 * /api/inventario:
 *   get:
 *     summary: Obtener todos los elementos de inventario
 *     tags: [Inventario]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de elementos
 */
router.get("/", authMiddleware(["administrador"]), inventarioController.getAll);

/**
 * @swagger
 * /api/inventario/{id}:
 *   get:
 *     summary: Obtener un elemento de inventario por ID
 *     tags: [Inventario]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del inventario
 *     responses:
 *       200:
 *         description: Datos del inventario
 *       404:
 *         description: Inventario no encontrado
 */
router.get("/:id", authMiddleware(["administrador"]), inventarioController.getById);

/**
 * @swagger
 * /api/inventario:
 *   post:
 *     summary: Crear un elemento de inventario
 *     tags: [Inventario]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - espacio_id
 *               - nombre_elemento
 *               - tipo
 *               - estado
 *             properties:
 *               espacio_id:
 *                 type: integer
 *               nombre_elemento:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [infraestructura, equipamiento]
 *               estado:
 *                 type: string
 *                 enum: [operativo, en_reparacion, desactivado]
 *               descripcion:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               patrimonio:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inventario creado
 */
router.post("/", authMiddleware(["administrador"]), inventarioController.create);

/**
 * @swagger
 * /api/inventario/{id}:
 *   put:
 *     summary: Actualizar un elemento de inventario
 *     tags: [Inventario]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               espacio_id:
 *                 type: integer
 *               nombre_elemento:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [infraestructura, equipamiento]
 *               estado:
 *                 type: string
 *                 enum: [operativo, en_reparacion, desactivado]
 *               descripcion:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               patrimonio:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inventario actualizado
 */
router.put("/:id", authMiddleware(["administrador"]), inventarioController.update);

/**
 * @swagger
 * /api/inventario/{id}:
 *   delete:
 *     summary: Eliminar un elemento de inventario
 *     tags: [Inventario]
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
 *         description: Inventario eliminado
 */
router.delete("/:id", authMiddleware(["administrador"]), inventarioController.delete);

module.exports = router;
