FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN mkdir -p /app/data

EXPOSE 8080

ENV NODE_OPTIONS="--max-old-space-size=1024"
CMD ["npx", "tsx", "src/index.ts"]
