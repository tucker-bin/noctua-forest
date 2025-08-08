FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static site
COPY . /usr/share/nginx/html

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Nginx listens on 80 by default; map 8080 to 80 inside container
ENV PORT=8080
CMD ["/bin/sh", "-c", "sed -i 's/listen 80/listen ${PORT}/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

