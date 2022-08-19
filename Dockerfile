# syntax=docker/dockerfile:1
FROM node:16
WORKDIR .
COPY . .
RUN yarn
CMD ["yarn", "serve"]
EXPOSE 8080