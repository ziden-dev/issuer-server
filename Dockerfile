FROM node:14 as base

WORKDIR /home/node/app

COPY package*.json ./

ADD pkg/ ./pkg/

RUN npm i

COPY . .

FROM base as production

ENV NODE_PATH=./build

RUN npm run build