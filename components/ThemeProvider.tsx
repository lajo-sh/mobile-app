import { View } from "react-native";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-primary-background h-screen w-screen flex">
      {children}
    </View>
  );
}
