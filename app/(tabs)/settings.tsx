import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { useTrustedUsers } from "@/components/useTrustedUsers";
import { useTranslation } from "@/components/LanguageProvider";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Profile() {
  const auth = useAuth();
  const { t } = useTranslation();
  const {
    trustedUsers,
    loading,
    error,
    fetchTrustedUsers,
    addTrustedUser,
    removeTrustedUser,
  } = useTrustedUsers();
  const [email, setEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddTrustedUser = async () => {
    if (!email) return;

    setAddError(null);
    const success = await addTrustedUser(email);
    if (success) {
      setEmail("");
    }
  };

  return (
    <ScrollView className="flex-1 bg-primary-background">
      <View className="px-4 py-6 gap-6">
        <View>
          <Text className="text-2xl font-bold text-white mb-2">
            {t("profile")}
          </Text>
          <Text className="text-lg text-white">
            {t("email")}: {auth.userEmail}
          </Text>
          {auth.fullName && (
            <Text className="text-lg text-white">
              {t("name")}: {auth.fullName}
            </Text>
          )}
        </View>

        <View className="gap-4">
          <Text className="text-xl font-bold text-white">
            {t("trustedUsers")}
          </Text>
          <Text className="text-gray-400">{t("trustedUsersDescription")}</Text>

          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-tertiary-background rounded-lg p-4 text-white"
              placeholder={t("enterEmail")}
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity
              className="bg-accent rounded-lg px-4 justify-center"
              onPress={handleAddTrustedUser}
            >
              <Text className="text-white">{t("addTrustedUser")}</Text>
            </TouchableOpacity>
          </View>

          {addError && <Text className="text-red-500">{addError}</Text>}

          <View className="gap-2">
            {loading ? (
              <Text className="text-gray-400">{t("loading")}</Text>
            ) : trustedUsers.length > 0 ? (
              trustedUsers.map((user) => (
                <View
                  key={user.id}
                  className="flex-row items-center justify-between bg-tertiary-background p-4 rounded-lg"
                >
                  <View>
                    <Text className="text-white">{user.email}</Text>
                    {user.fullName && (
                      <Text className="text-gray-400">{user.fullName}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => removeTrustedUser(user.id)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color="#f42e2e"
                    />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text className="text-gray-400">{t("noTrustedUsers")}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          className="bg-accent p-4 rounded-lg items-center mt-4"
          onPress={() => auth.signOut()}
        >
          <Text className="text-white font-bold">{t("logout")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
