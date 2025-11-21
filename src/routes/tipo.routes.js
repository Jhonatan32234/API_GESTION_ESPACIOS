const express = require("express");
const router = express.Router();
const tipoController = require("../controllers/tipo.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Tipos
 *   description: Gestión de tipos de espacio (CRUD)
 */

/**
 * @swagger
 * /api/tipos:
 *   get:
 *     summary: Obtener todos los tipos
 *     tags: [Tipos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tipo_id:
 *                     type: integer
 *                     example: 1
 *                   nombre:
 *                     type: string
 *                     example: "Presencial"
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get("/", authMiddleware(["administrador", "docente"]), tipoController.getAll);

/**
 * @swagger
 * /api/tipos/{id}:
 *   get:
 *     summary: Obtener un tipo por ID
 *     tags: [Tipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo
 *     responses:
 *       200:
 *         description: Tipo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tipo_id:
 *                   type: integer
 *                   example: 1
 *                 nombre:
 *                   type: string
 *                   example: "Presencial"
 *       404:
 *         description: Tipo no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get("/:id", authMiddleware(["administrador", "docente"]), tipoController.getById);

/**
 * @swagger
 * /api/tipos:
 *   post:
 *     summary: Crear un nuevo tipo
 *     tags: [Tipos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 60
 *                 example: "Virtual"
 *     responses:
 *       201:
 *         description: Tipo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tipo_id:
 *                   type: integer
 *                   example: 2
 *                 nombre:
 *                   type: string
 *                   example: "Virtual"
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post("/", authMiddleware(["administrador"]), tipoController.create);

/**
 * @swagger
 * /api/tipos/{id}:
 *   put:
 *     summary: Actualizar un tipo existente
 *     tags: [Tipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 60
 *                 example: "Híbrido"
 *     responses:
 *       200:
 *         description: Tipo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tipo_id:
 *                   type: integer
 *                   example: 2
 *                 nombre:
 *                   type: string
 *                   example: "Híbrido"
 *       404:
 *         description: Tipo no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put("/:id", authMiddleware(["administrador"]), tipoController.update);

/**
 * @swagger
 * /api/tipos/{id}:
 *   delete:
 *     summary: Eliminar un tipo
 *     tags: [Tipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo a eliminar
 *     responses:
 *       204:
 *         description: Tipo eliminado exitosamente
 *       404:
 *         description: Tipo no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete("/:id", authMiddleware(["administrador"]), tipoController.delete);

module.exports = router;