module.exports = {
  apps: [
    {
      name: "api",
      cwd: "/opt/websites/backend",
      script: "dist/server.js",
      instances: 2,              // 2 instance API
      exec_mode: "cluster",
      env: {
        PORT: 4000,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/api-error.log",
      out_file: "/opt/websites/logs/api-out.log",

      merge_logs: true,
      autorestart: true,
      max_memory_restart: "512M",   // đổi xuống 512MB
    },
    {
      name: "frontend",
      cwd: "/opt/websites/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",             // ví dụ "next start -p 3000"
      instances: 2,              // 2 instance web để reload không sập
      exec_mode: "cluster",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/frontend-error.log",
      out_file: "/opt/websites/logs/frontend-out.log",

      merge_logs: true,
      autorestart: true,
      max_memory_restart: "512M",
    },
    {
      name: "admin",
      cwd: "/opt/websites/admin",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,              // admin ít user, 1 instance là đủ
      exec_mode: "cluster",
      env: {
        PORT: 3001,
        NODE_ENV: "production",
      },
      error_file: "/opt/websites/logs/admin-error.log",
      out_file: "/opt/websites/logs/admin-out.log",

      merge_logs: true,
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
