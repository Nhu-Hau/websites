module.exports = {
  apps: [
    {
      name: "api",
      cwd: "/opt/websites/backend",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        PORT: 4000,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/api-error.log",
      out_file: "/opt/websites/logs/api-out.log",

      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
    },
    {
      name: "frontend",
      cwd: "/opt/websites/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/frontend-error.log",
      out_file: "/opt/websites/logs/frontend-out.log",

      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
    },
    {
      name: "admin",
      cwd: "/opt/websites/admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      instances: 1,
      exec_mode: "fork",
      env: {
        PORT: 3001,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/admin-error.log",
      out_file: "/opt/websites/logs/admin-out.log",

      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};
