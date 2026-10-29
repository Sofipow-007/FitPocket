# Imagen de producción del backend (alternativa a desplegar directo en Render/Railway)
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# solo dependencias de producción: jest, supertest, etc. no van a la imagen
RUN npm ci --omit=dev

COPY . .

ENV PORT=3000
EXPOSE 3000

# usuario sin privilegios (viene en la imagen oficial de node)
USER node

CMD ["node", "index.js"]
