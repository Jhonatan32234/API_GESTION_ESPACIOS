const express = require("express");
const router = express.Router();
const espacioController = require("../controllers/espacio.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Espacios
 *   description: Gestión de espacios
 */

/**
 * @swagger
 * /api/espacios:
 *   get:
 *     summary: Obtener todos los espacios
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de espacios
 */
router.get("/", authMiddleware(["administrador","docente"]), espacioController.getAll);


/**
 * @swagger
 * /api/espacios/ubicacion/{ubicacionId}:
 *   get:
 *     summary: Obtener todos los espacios de una ubicación específica
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ubicacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la ubicación
 *     responses:
 *       200:
 *         description: Lista de espacios pertenecientes a la ubicación indicada
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Espacio'
 *       404:
 *         description: No se encontraron espacios para la ubicación indicada
 */
router.get("/ubicacion/:ubicacionId", authMiddleware(["administrador", "docente"]), espacioController.getEspaciosByUbicacion);


/**
 * @swagger
 * /api/espacios/{id}:
 *   get:
 *     summary: Obtener espacio por ID
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *     responses:
 *       200:
 *         description: Datos del espacio
 *       404:
 *         description: Espacio no encontrado
 */
router.get("/:id", authMiddleware(["administrador","docente"]), espacioController.getById);

/**
 * @swagger
 * /api/espacios:
 *   post:
 *     summary: Crear un espacio
 *     tags: [Espacios]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo
 *               - categoria
 *               - ubicacionId
 *               - capacidad
 *             properties:
 *               nombre:
 *                 type: string
 *               ubicacionId:
 *                 type: integer
 *               capacidad:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               disponible:
 *                 type: boolean
 *               tipoId:
 *                 type: integer
 *               inventario:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventario_id:
 *                       type: integer
 *                       description: ID de inventario existente (opcional). Si se provee, se asignará ese inventario al espacio.
 *                     catalogo_id:
 *                       type: integer
 *                       description: ID del catálogo requerido para crear un nuevo inventario
 *                     cantidad:
 *                       type: integer
 *                     marca:
 *                       type: string
 *                     modelo:
 *                       type: string
 *                     patrimonio:
 *                       type: string
 *                     estado:
 *                       type: string
 *                     observaciones:
 *                       type: string
 *                   example:
 *                     catalogo_id: 5
 *                     cantidad: 1
 *                     marca: "HP"
 *                     modelo: "ProBook"
 *                     patrimonio: "P123"
 *                     observaciones: "Equipo nuevo"
 *     responses:
 *       201:
 *         description: Espacio creado
 */
router.post("/", authMiddleware(["administrador"]), espacioController.create);

/**
 * @swagger
 * /api/espacios/{id}:
 *   put:
 *     summary: Actualizar un espacio
 *     tags: [Espacios]
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
 *               nombre:
 *                 type: string
 *               ubicacionId:
 *                 type: integer   
 *               capacidad:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               disponible:
 *                 type: boolean
 *               tipoId:
 *                 type: integer
 *               inventario:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventario_id:
 *                       type: integer
 *                       description: ID de inventario existente (opcional). Si se provee, se asignará ese inventario al espacio.
 *                     catalogo_id:
 *                       type: integer
 *                       description: ID del catálogo requerido para crear un nuevo inventario
 *                     cantidad:
 *                       type: integer
 *                     marca:
 *                       type: string
 *                     modelo:
 *                       type: string
 *                     patrimonio:
 *                       type: string
 *                     estado:
 *                       type: string
 *                     observaciones:
 *                       type: string
 *                   example:
 *                     catalogo_id: 5
 *                     cantidad: 1
 *                     marca: "HP"
 *                     modelo: "ProBook"
 *                     patrimonio: "P123"
 *                     observaciones: "Equipo nuevo"
 *     responses:
 *       200:
 *         description: Espacio actualizado
 */
router.put("/:id", authMiddleware(["administrador"]), espacioController.update);

/**
 * @swagger
 * /api/espacios/{id}:
 *   delete:
 *     summary: Eliminar un espacio
 *     tags: [Espacios]
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
 *         description: Espacio eliminado
 */
router.delete("/:id", authMiddleware(["administrador"]), espacioController.delete);

module.exports = router;
