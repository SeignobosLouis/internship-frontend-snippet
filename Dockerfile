FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm install --loglevel silly
RUN npm run build

FROM nginx:latest
COPY --from=build /app/dist/naval-group-frontend-core /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
