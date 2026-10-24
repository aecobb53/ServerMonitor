FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---

FROM nginx:alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
# The nginx image runs envsubst on /etc/nginx/templates/*.template at startup,
# filling in CONTROL_CORE_URL from the container environment.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Renders /config.js (TRUSTED_DOMAINS) at container start.
COPY config.js.template /opt/config.js.template
COPY 40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80
