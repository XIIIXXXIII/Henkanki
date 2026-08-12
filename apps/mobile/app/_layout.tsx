/** Kanso Industrial: mobile keeps the conversion route visible but never crowded. */
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function Layout() { return <SafeAreaProvider><Stack screenOptions={{ headerShown: false, animation: "fade" }} /></SafeAreaProvider>; }
