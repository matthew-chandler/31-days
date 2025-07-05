<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Fireworks React Application

This is a React application that creates interactive fireworks when users click anywhere on the screen. The fireworks should have:

- Various colors (red, blue, gold, green, purple, orange, white)
- Different effects (brocade, strobe, chrysanthemum, peony, ring, crackling)
- Realistic physics and animations
- Clean, modern code structure with proper component separation

## Technical Requirements
- Use modern React with hooks
- Implement CSS animations for fireworks effects
- Use requestAnimationFrame for smooth animations
- Ensure good performance with proper cleanup
- Follow React best practices for state management

## Deployment Guide

This section covers how to build and deploy the fireworks application to a web server using nginx.

### Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```
   This creates an optimized production build in the `dist/` folder.

2. **Preview the build locally (optional):**
   ```bash
   npm run preview
   ```

### File Structure After Build

After running `npm run build`, you'll have:
```
dist/
├── index.html           # Main HTML file
├── assets/
│   ├── index-[hash].js  # Bundled JavaScript
│   ├── index-[hash].css # Bundled CSS
│   └── [other assets]   # Images, fonts, etc.
└── vite.svg            # Default favicon (replace with favicon.ico)
```

### Nginx Configuration

#### Basic nginx server block:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain
    
    # Document root points to the dist folder
    root /var/www/fireworks/dist;
    index index.html;
    
    # Handle SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle favicon
    location /favicon.ico {
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css text/javascript application/javascript application/json;
}
```

#### For HTTPS (recommended):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL certificate paths (adjust for your setup)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Document root points to the dist folder
    root /var/www/fireworks/dist;
    index index.html;
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css text/javascript application/javascript application/json;
}
```

### Deployment Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Upload files to your server:**
   ```bash
   # Copy the dist folder to your web server
   scp -r dist/ user@your-server:/var/www/fireworks/
   ```

3. **Set proper permissions:**
   ```bash
   # On your server
   sudo chown -R www-data:www-data /var/www/fireworks/
   sudo chmod -R 755 /var/www/fireworks/
   ```

4. **Create nginx configuration:**
   ```bash
   # Create site configuration
   sudo nano /etc/nginx/sites-available/fireworks
   
   # Enable the site
   sudo ln -s /etc/nginx/sites-available/fireworks /etc/nginx/sites-enabled/
   
   # Test nginx configuration
   sudo nginx -t
   
   # Reload nginx
   sudo systemctl reload nginx
   ```

### Important Notes

- **Document Root:** Point nginx to the `dist/` folder, not the project root
- **Assets:** Make sure `src/assets/cityscape_night.jpg` and `src/assets/favicon.ico` are included in your build
- **SPA Routing:** The `try_files` directive ensures the app works as a Single Page Application
- **Caching:** Static assets are cached for better performance
- **Security:** Basic security headers are included

### Troubleshooting

- **404 errors:** Make sure nginx root points to the `dist/` folder
- **Assets not loading:** Check file permissions and nginx error logs
- **MIME type errors:** Ensure nginx has proper MIME type configuration for `.js` and `.css` files
