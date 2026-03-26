FROM node:20-alpine

# Actualizar los paquetes del sistema operativo para aplicar parches de seguridad
RUN apk update && apk upgrade --no-cache

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]