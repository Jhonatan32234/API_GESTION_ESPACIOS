const express = require("express");
const router = express.Router();
const inventarioController = require("../controllers/inventario.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Inventario
 *   description: Gestión de elementos de inventario
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Inventario:
 *       type: object
 *       required:
 *         - catalogo_id
 *       properties:
 *         inventario_id:
 *           type: integer
 *           description: ID autoincremental
 *         catalogo_id:
 *           type: integer
 *           description: ID del elemento en el catálogo
 *         cantidad:
 *           type: integer
 *           default: 1
 *         marca:
 *           type: string
 *         modelo:
 *           type: string
 *         patrimonio:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [disponible, en_uso, mantenimiento, danado, baja]
 *           default: disponible
 *         observaciones:
 *           type: string
 *         fecha_adquisicion:
 *           type: string
 *           format: date
 *         fecha_creacion:
 *           type: string
 *           format: date-time
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
 *         description: Lista de elementos de inventario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inventario'
 */
router.get("/", authMiddleware(["administrador","docente"]), inventarioController.getAll);

/**
 * @swagger
 * /api/inventario/disponibles:
 *   get:
 *     summary: Obtener elementos de inventario disponibles (sin asignar)
 *     tags: [Inventario]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de inventario disponible
 */
router.get("/disponibles", authMiddleware(["administrador","docente"]), inventarioController.getDisponibles);

/**
 * @swagger
 * /api/inventario/espacio/{espacioId}:
 *   get:
 *     summary: Obtener inventario asignado a un espacio
 *     tags: [Inventario]
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
 *         description: Lista de inventario del espacio
 */
router.get("/espacio/:espacioId", authMiddleware(["administrador","docente"]), inventarioController.getByEspacio);

/**
 * @swagger
 * /api/inventario/catalogo/{catalogoId}:
 *   get:
 *     summary: Obtener inventario por elemento del catálogo
 *     tags: [Inventario]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: catalogoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del elemento del catálogo
 *     responses:
 *       200:
 *         description: Lista de inventario del catálogo especificado
 */
router.get("/catalogo/:catalogoId", authMiddleware(["administrador","docente"]), inventarioController.getByCatalogo);

/**
 * @swagger
 * /api/inventario/tipo/{tipo}:
 *   get:
 *     summary: Obtener inventario por tipo (equipamiento, mobiliario, infraestructura)
 *     tags: [Inventario]
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
 *         description: Lista de inventario del tipo especificado
 */
router.get("/tipo/:tipo", authMiddleware(["administrador","docente"]), inventarioController.getByTipo);

/**
 * @swagger
 * /api/inventario/con-software:
 *   get:
 *     summary: Obtener inventario con información de software asociado
 *     tags: [Inventario]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de inventario con software
 */
router.get("/con-software", authMiddleware(["administrador","docente"]), inventarioController.getConSoftware);

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
router.get("/:id", authMiddleware(["administrador","docente"]), inventarioController.getById);

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
 *               - catalogo_id
 *             properties:
 *               catalogo_id:
 *                 type: integer
 *                 example: 1
 *               cantidad:
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *               marca:
 *                 type: string
 *                 example: "Null"
 *               modelo:
 *                 type: string
 *                 example: "Null"
 *               patrimonio:
 *                 type: string
 *                 example: "Null"
 *               estado:
 *                 type: string
 *                 enum: [disponible, en_uso, desactivado, mantenimiento]
 *                 default: disponible
 *                 example: "disponible"
 *               observaciones:
 *                 type: string
 *                 example: "Nuevo en caja"
 *     responses:
 *       201:
 *         description: Inventario creado exitosamente
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
 *               catalogo_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               patrimonio:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [disponible, en_uso, desactivado, mantenimiento]
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inventario actualizado exitosamente
 */
router.put("/:id", authMiddleware(["administrador"]), inventarioController.update);

/**
 * @swagger
 * /api/inventario/{id}/estado:
 *   put:
 *     summary: Cambiar el estado de un elemento de inventario
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
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [disponible, en_uso, mantenimiento, danado, baja]
 *                 example: "mantenimiento"
 *     responses:
 *       200:
 *         description: Estado del inventario actualizado
 */
router.put("/:id/estado", authMiddleware(["administrador"]), inventarioController.cambiarEstado);

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
 *         description: Inventario eliminado exitosamente
 *       400:
 *         description: No se puede eliminar porque tiene asignaciones activas
 */
router.delete("/:id", authMiddleware(["administrador"]), inventarioController.delete);

module.exports = router;