import React, { useContext } from "react";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { AuthContext } from "@/contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);

  const Groups = [
    {
      id: 1,
      title: "OAMK Students",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s",
    },
    {
      id: 2,
      title: "Fonty Students",
      icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png",
    },
    {
      id: 3,
      title: "Front-End Developers",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s",
    },
    {
      id: 4,
      title: "Back-End Developers",
      icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png",
    },
    {
      id: 5,
      title: "IT Bachelor Programme",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s",
    },
    {
      id: 6,
      title: "React Native Course Students",
      icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png",
    },
  ];

  return (
    <SafeAreaView>
      <Header
        username={user?.username ?? "Guest"}
        avatar={
          user?.profilePicture ?? require("@/assets/images/avatar/default-avatar.jpeg")
        }
      />

      <SearchBar />

      {Groups.map((group) => (
        <Chat key={group.id} title={group.title} icon={group.icon} />
      ))}
    </SafeAreaView>
  );
}
