FROM node:20-alpine AS build
WORKDIR /app
COPY package.json vite.config.ts index.html ./
RUN npm install
COPY src ./src
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
