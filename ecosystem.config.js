module.exports = {
  apps: [
    {
      name: "api",
      cwd: "/opt/websites/backend",
      script: "node",
      args: "dist/server.js",
      env: {
        PORT: 4000,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/api-error.log",
      out_file: "/opt/websites/logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
    },
    {
      name: "frontend",
      cwd: "/opt/websites/frontend",
      script: "npm",
      args: "start",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/frontend-error.log",
      out_file: "/opt/websites/logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
    },
    {
      name: "admin",
      cwd: "/opt/websites/admin",
      script: "npm",
      args: "start",
      env: {
        PORT: 3001,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/admin-error.log",
      out_file: "/opt/websites/logs/admin-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};





