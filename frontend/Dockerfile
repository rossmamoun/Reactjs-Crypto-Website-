# Étape de build
FROM node:18-alpine as build
WORKDIR /app

COPY package*.json ./
# Installe les dépendances
RUN npm install

# Copier le reste des sources
COPY . .

RUN npm run build

# Étape finale (Nginx)
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]