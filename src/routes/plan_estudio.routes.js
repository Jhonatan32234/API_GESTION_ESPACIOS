const express = require("express");
const router = express.Router();
const planEstudioController = require("../controllers/plan_estudio.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: PlanesEstudio
 *   description: Gestión de los planes de estudio
 */

/**
 * @swagger
 * /api/planes/materias:
 *   get:
 *     summary: Obtener todos los planes de estudio con las materias las cuales estan relacionadas
 *     tags: [PlanesEstudio]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de planes de estudio
 */
router.get("/materias", authMiddleware(["administrador", "docente"]), planEstudioController.getAll);

/**
 * @swagger
 * /api/planes/:
 *   get:
 *     summary: Obtener todos los planes de estudio
 *     tags: [PlanesEstudio]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista básica de planes de estudio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   plan_id:
 *                     type: integer
 *                   nombre_carrera:
 *                     type: string
 *                   codigo_plan:
 *                     type: string
 *                   fecha_creacion:
 *                     type: string
 *                     format: date-time
 */
router.get("/", authMiddleware(["administrador", "docente"]), planEstudioController.getAllBasic);


/**
 * @swagger
 * /api/planes/{id}:
 *   get:
 *     summary: Obtener un plan de estudio por ID
 *     tags: [PlanesEstudio]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del plan
 *     responses:
 *       200:
 *         description: Datos del plan
 *       404:
 *         description: Plan no encontrado
 */
router.get("/:id", authMiddleware(["administrador", "docente"]), planEstudioController.getById);

/**
 * @swagger
 * /api/planes:
 *   post:
 *     summary: Crear un plan de estudio
 *     tags: [PlanesEstudio]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_carrera:
 *                 type: string
 *               codigo_plan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plan creado
 */
router.post("/", authMiddleware(["administrador"]), planEstudioController.create);

/**
 * @swagger
 * /api/planes/{id}:
 *   put:
 *     summary: Actualizar un plan de estudio
 *     tags: [PlanesEstudio]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Plan actualizado
 */
router.put("/:id", authMiddleware(["administrador"]), planEstudioController.update);

/**
 * @swagger
 * /api/planes/{id}:
 *   delete:
 *     summary: Eliminar un plan de estudio
 *     tags: [PlanesEstudio]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del plan
 *     responses:
 *       204:
 *         description: Plan eliminado
 */
router.delete("/:id", authMiddleware(["administrador"]), planEstudioController.delete);

module.exports = router;
