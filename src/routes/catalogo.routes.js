const express = require("express");
const router = express.Router();
const catalogoController = require("../controllers/catalogo.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Catálogo
 *   description: Gestión del catálogo de elementos de inventario
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CatalogoElemento:
 *       type: object
 *       required:
 *         - nombre_elemento
 *         - tipo
 *       properties:
 *         catalogo_id:
 *           type: integer
 *           description: ID autoincremental
 *         nombre_elemento:
 *           type: string
 *           description: Nombre del elemento
 *         tipo:
 *           type: string
 *           enum: [equipamiento, mobiliario, infraestructura]
 *           description: Tipo de elemento
 *         descripcion:
 *           type: string
 *           description: Descripción del elemento
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 */

/**
 * @swagger
 * /api/catalogo:
 *   get:
 *     summary: Obtener todos los elementos del catálogo
 *     tags: [Catálogo]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de elementos del catálogo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CatalogoElemento'
 */
router.get("/", authMiddleware(["administrador", "docente"]), catalogoController.getAll);

/**
 * @swagger
 * /api/catalogo/tipo/{tipo}:
 *   get:
 *     summary: Obtener elementos del catálogo por tipo
 *     tags: [Catálogo]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [equipamiento, mobiliario, infraestructura]
 *         description: Tipo de elemento
 *     responses:
 *       200:
 *         description: Lista de elementos del tipo especificado
 */
router.get("/tipo/:tipo", authMiddleware(["administrador", "docente"]), catalogoController.getByTipo);

/**
 * @swagger
 * /api/catalogo/{id}:
 *   get:
 *     summary: Obtener elemento del catálogo por ID
 *     tags: [Catálogo]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del elemento del catálogo
 *     responses:
 *       200:
 *         description: Datos del elemento del catálogo
 *       404:
 *         description: Elemento no encontrado
 */
router.get("/:id", authMiddleware(["administrador", "docente"]), catalogoController.getById);

/**
 * @swagger
 * /api/catalogo:
 *   post:
 *     summary: Crear un nuevo elemento en el catálogo
 *     tags: [Catálogo]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_elemento
 *               - tipo
 *             properties:
 *               nombre_elemento:
 *                 type: string
 *                 example: "Silla ergonómica"
 *               tipo:
 *                 type: string
 *                 enum: [equipamiento, mobiliario, infraestructura]
 *                 example: "mobiliario"
 *               descripcion:
 *                 type: string
 *                 example: "Silla ergonómica para profesor"
 *     responses:
 *       201:
 *         description: Elemento creado exitosamente
 */
router.post("/", authMiddleware(["administrador"]), catalogoController.create);

/**
 * @swagger
 * /api/catalogo/{id}:
 *   put:
 *     summary: Actualizar elemento del catálogo
 *     tags: [Catálogo]
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
 *               nombre_elemento:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [equipamiento, mobiliario, infraestructura]
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Elemento actualizado
 */
router.put("/:id", authMiddleware(["administrador"]), catalogoController.update);

/**
 * @swagger
 * /api/catalogo/{id}:
 *   delete:
 *     summary: Eliminar elemento del catálogo
 *     tags: [Catálogo]
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
 *         description: Elemento eliminado
 */
router.delete("/:id", authMiddleware(["administrador"]), catalogoController.delete);

module.exports = router;