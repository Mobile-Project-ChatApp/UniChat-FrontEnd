import User from "@/types/Users";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  ImageSourcePropType,
} from "react-native";

export default function Header({
  username,
  avatar,
}: {
  username: string;
  avatar: ImageSourcePropType; // Accept both `require()` and URLs
}) {
  return (
    <View style={styles.container}>
      <View style={styles.userContainer}>
        <Image source={avatar} style={styles.avatar} />
        <Text style={styles.username}>{username}</Text>
      </View>
      <View>
        <MaterialIcons name="notifications" size={28} color="black" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f2f9d9",
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
