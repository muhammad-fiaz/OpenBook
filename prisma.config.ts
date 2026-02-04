import path from "node:path";
import { defineConfig, env } from "prisma/config";
import { config } from "dotenv";

config();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
});
