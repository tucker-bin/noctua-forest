FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static site
COPY . /usr/share/nginx/html

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start nginx (config already listens on 8080)
CMD ["nginx", "-g", "daemon off;"]

