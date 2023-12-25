FROM node:18.18-alpine3.17

WORKDIR /app

COPY . .

RUN npm i pm2 -g
RUN npm i
RUN npm run build

EXPOSE 3000

CMD [ "node" , 'dist/app.js']
