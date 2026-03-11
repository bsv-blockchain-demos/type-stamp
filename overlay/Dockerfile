FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["npx", "tsx", "src/index.ts"]
