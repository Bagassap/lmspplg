const path = require("path");

const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: "lms-backend",
      cwd: path.join(ROOT, "backend"),
      script: "dist/src/main.js",
      node_args: "--enable-source-maps",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "400M",
      out_file: path.join(ROOT, "logs", "lms-backend.out.log"),
      error_file: path.join(ROOT, "logs", "lms-backend.err.log"),
      time: true,
    },
    {
      name: "lms-frontend",
      cwd: path.join(ROOT, "frontend"),
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      max_memory_restart: "400M",
      out_file: path.join(ROOT, "logs", "lms-frontend.out.log"),
      error_file: path.join(ROOT, "logs", "lms-frontend.err.log"),
      time: true,
    },
  ],
};
