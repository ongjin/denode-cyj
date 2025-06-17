FROM node:18.17.0-slim AS builder

ENV NODE_ENV=development
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

FROM node:18.17.0-slim AS dev

ENV NODE_ENV=development
WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
