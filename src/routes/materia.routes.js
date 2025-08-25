const express = require("express");
const router = express.Router();
const materiaController = require("../controllers/materia.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Materias
 *   description: Gestión de materias (CRUD)
 */

/**
 * @swagger
 * /api/materias:
 *   get:
 *     summary: Obtener todas las materias
 *     tags: [Materias]
 *     responses:
 *       200:
 *         description: Lista de materias
 */
router.get("/",authMiddleware(["administrador","docente"]), materiaController.getAll);

/**
 * @swagger
 * /api/materias/{id}:
 *   get:
 *     summary: Obtener materia por ID
 *     tags: [Materias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:  
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Datos de la materia
 *       404:
 *         description: No encontrada
 */
router.get("/:id", authMiddleware(["administrador","docente"]), materiaController.getById);

/**
 * @swagger
 * /api/materias:
 *   post:
 *     summary: Crear materia
 *     tags: [Materias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan_id
 *               - nombre
 *               - codigo_materia
 *               - nivel
 *             properties:
 *               plan_id:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               codigo_materia:
 *                 type: string
 *               nivel:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Materia creada
 *       400:
 *         description: Error en los datos
 */
router.post("/", authMiddleware(["administrador"]), materiaController.create);

/**
 * @swagger
 * /api/materias/{id}:
 *   put:
 *     summary: Actualizar materia
 *     tags: [Materias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan_id:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               codigo_materia:
 *                 type: string
 *               nivel:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Materia actualizada
 *       400:
 *         description: Error en los datos
 */
router.put("/:id", authMiddleware(["administrador"]), materiaController.update);

/**
 * @swagger
 * /api/materias/{id}:
 *   delete:
 *     summary: Eliminar materia
 *     tags: [Materias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       204:
 *         description: Materia eliminada
 */
router.delete("/:id", authMiddleware(["administrador"]), materiaController.delete);

/**
 * @swagger
 * /api/materias/plan/{plan_id}:
 *   get:
 *     summary: Obtener todas las materias de un plan de estudios
 *     tags: [Materias]
 *     parameters:
 *       - in: path
 *         name: plan_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del plan de estudio
 *     responses:
 *       200:
 *         description: Lista de materias del plan
 *       404:
 *         description: No se encontraron materias
 */
router.get("/plan/:plan_id", authMiddleware(["administrador","docente"]), materiaController.getByPlanId);


module.exports = router;
