const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Gestión de Espacios",
      version: "1.0.0",
      description: "Documentación de la API de Gestión de Espacios"
    }
  },
  apis: ["./src/docs/*.js", "./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
