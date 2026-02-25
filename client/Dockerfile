FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE ${CLIENT_PORT}

CMD [ "npm", "run", "dev"]

