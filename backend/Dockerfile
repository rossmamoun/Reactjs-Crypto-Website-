# backend/Dockerfile
FROM node:18-alpine

# 1) Installer python3, make, g++, et les headers ODBC
RUN apk add --no-cache python3 make g++ unixodbc-dev

WORKDIR /app

# 2) Copier les fichiers package*.json
COPY package*.json ./

# 3) Installer les dépendances
#    --production ou --omit=dev pour ignorer devDependencies (selon npm version)
RUN npm install --production

# 4) Copier le reste des sources
COPY . /app

# Expose le port 5000 (backend)
EXPOSE 5000

# Lancer le backend
CMD ["node", "index.js"]
