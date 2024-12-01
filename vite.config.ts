import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

function envValidationPlugin(env: Record<string, string>) {
  return {
    name: "vite-plugin-env-validation", // name of the plugin
    config() {
      const requiredEnvVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]; // list of required env variables

      const missingEnvVars = requiredEnvVars.filter((envVar) => !env[envVar]);

      if (missingEnvVars.length > 0) {
        // Display error message with emojis
        throw new Error(
          `❌ Missing required environment variables: ${missingEnvVars.join(
            ", "
          )} 😞`
        );
      }

      // Success message with emoji
      console.log("✅ All required environment variables are set. 🎉");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [vue(), envValidationPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
