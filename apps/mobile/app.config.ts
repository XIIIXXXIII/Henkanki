import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Henkanki", slug: "henkanki", version: "1.0.0",
  scheme: "henkanki", userInterfaceStyle: "dark", orientation: "portrait",
  ios: { supportsTablet: true, bundleIdentifier: "io.henkanki.app" },
  android: { package: "io.henkanki.app", adaptiveIcon: { backgroundColor: "#121211" } },
  plugins: ["expo-router", "expo-document-picker", "expo-sharing"],
  experiments: { typedRoutes: true }
};
export default config;
