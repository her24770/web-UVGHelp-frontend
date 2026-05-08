#!/bin/sh
# Lee las variables de entorno y genera js/config.js antes de arrancar nginx
cat > /usr/share/nginx/html/js/config.js <<EOF
export const API_BASE  = '${API_BASE}';
export const TOKEN_KEY = '${TOKEN_KEY}';
EOF

exec nginx -g 'daemon off;'
