import { useState, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Linking, Alert } from "react-native";
import axios from "axios";
import { useAuth } from "./AuthProvider";
import { router } from "expo-router";

export async function registerForPushNotificationsAsync() {
  let token: string | undefined;

  try {
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return;
    }

    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
        });
      } catch (error) {
        console.error("Failed to create notification channel:", error);
      }
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      } catch (permError) {
        console.error("Error requesting notification permissions:", permError);
        return;
      }
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    try {
      if (!process.env.EXPO_PUBLIC_PROJECT_ID) {
        throw new Error("Expo project ID is not configured");
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      token = tokenData.data;
    } catch (error) {
      console.error("Error getting push token:", error);
    }

    return token;
  } catch (error) {
    console.error("Unexpected error in registering push notifications:", error);
    return undefined;
  }
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] =
    useState<Notifications.Notification>();
  const [registerError, setRegisterError] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const registrationRetryCount = useRef(0);
  const registrationMaxRetries = 3;
  const { session } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const registerDevice = async (token: string) => {
      try {
        setRegisterError(null);

        if (!process.env.EXPO_PUBLIC_BASE_URL) {
          throw new Error("API URL is not configured");
        }

        await axios.post(
          `${process.env.EXPO_PUBLIC_BASE_URL}/notifications/register`,
          { token },
          {
            headers: {
              Authorization: `Bearer ${session}`,
            },
            timeout: 10000,
          },
        );

        registrationRetryCount.current = 0;
      } catch (error) {
        if (!isMounted) return;

        let shouldRetry = false;
        let errorMessage = "Failed to register for notifications";

        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            errorMessage = "Registration request timed out";
            shouldRetry = true;
          } else if (!error.response) {
            errorMessage = "Network error. Please check your connection";
            shouldRetry = true;
          } else if (
            error.response.status === 401 ||
            error.response.status === 403
          ) {
            errorMessage = "Authentication error. Please sign in again";
          } else if (error.response.status >= 500) {
            errorMessage = "Server error. Please try again later";
            shouldRetry = true;
          }
        }

        console.warn(`Notification registration error: ${errorMessage}`, error);
        setRegisterError(errorMessage);

        if (
          shouldRetry &&
          registrationRetryCount.current < registrationMaxRetries
        ) {
          const retryDelay = 2 ** registrationRetryCount.current * 1000;
          registrationRetryCount.current++;
          setTimeout(() => {
            if (isMounted) registerDevice(token);
          }, retryDelay);
        }
      }
    };

    const handleNotificationResponse = async (
      response: Notifications.NotificationResponse,
    ) => {
      try {
        const { data } = response.notification.request.content;

        if (
          data?.code &&
          response.notification.request.content.title?.includes(
            "Phishing Alert",
          )
        ) {
          try {
            router.push({
              pathname: "/phishing-alert",
              params: {
                code: data.code,
                url: data.url || "",
              },
            });
            return;
          } catch (error) {
            console.error("Error handling phishing alert notification:", error);
            Alert.alert(
              "Navigation Error",
              `Could not open the phishing alert screen. Code: ${data.code}`,
              [{ text: "OK" }],
            );
          }
        }

        if (data?.url) {
          try {
            if (typeof data.url !== "string") {
              throw new Error("Invalid URL format");
            }

            if (data.url.startsWith("http")) {
              const supported = await Linking.canOpenURL(data.url);
              if (supported) {
                await Linking.openURL(data.url);
              } else {
                console.error("Cannot open URL:", data.url);
                Alert.alert(
                  "Cannot Open URL",
                  "The URL from the notification cannot be opened",
                  [{ text: "OK" }],
                );
              }
            }
          } catch (error) {
            console.error("Error handling notification URL:", error);
            Alert.alert(
              "Error Opening Content",
              "Could not open the content from the notification",
              [{ text: "OK" }],
            );
          }
        }
      } catch (error) {
        console.error("Error processing notification response:", error);
      }
    };

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();

        if (token && session && isMounted) {
          setExpoPushToken(token);
          registerDevice(token);
        }

        if (isMounted) {
          notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
              try {
                setNotification(notification);
              } catch (error) {
                console.error("Error handling received notification:", error);
              }
            });
        }

        if (isMounted) {
          responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
              handleNotificationResponse,
            );
        }
      } catch (error) {
        console.error("Error setting up notifications:", error);
        setRegisterError("Failed to initialize notifications");
      }
    };

    setupNotifications();

    return () => {
      isMounted = false;

      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(
            notificationListener.current,
          );
        }

        if (responseListener.current) {
          Notifications.removeNotificationSubscription(
            responseListener.current,
          );
        }
      } catch (error) {
        console.error("Error cleaning up notification listeners:", error);
      }
    };
  }, [session]);

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput,
  ) => {
    try {
      if (!title || typeof title !== "string") {
        throw new Error("Title is required and must be a string");
      }

      if (!body || typeof body !== "string") {
        throw new Error("Body is required and must be a string");
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: trigger || null,
      });

      return identifier;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      throw new Error(
        `Failed to schedule notification: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const dismissAllNotifications = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error("Error dismissing notifications:", error);
    }
  };

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error("Error checking notification permissions:", error);
      return "error";
    }
  };

  return {
    expoPushToken,
    notification,
    registerError,
    scheduleLocalNotification,
    dismissAllNotifications,
    checkPermissions,
  };
}
