import Chat from "@/components/Chat";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {

  const Users = [
    { id: 1, username: 'toshi', 
      avatar: "https://pbs.twimg.com/profile_images/1878018568199036928/rQEIyiM-_400x400.jpg", 
      IsAdmin: true, status: "Online" },
    { id: 2, username: 'Jay',
      avatar: "https://pbs.twimg.com/media/FTI52wzVUAgCr3d.jpg:large",
      IsAdmin: true, status: "Online" },

  ];

  const Groups = [
    { id: 1, title: 'OAMK Students', icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s" },
    { id: 2, title: 'Fonty Students', icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png" },
    { id: 3, title: 'Front-End Developers', icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s" },
    { id: 4, title: 'Back-End Developers', icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png" },
    { id: 5, title: 'IT Bachelor Programme', icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPPPTmS2vzKcDth3N8ea5Sq_kHfbGE1FezMw&s" },
    { id: 6, title: 'React Native Course Students', icon: "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Fontys_University_of_Applied_Sciences.png" },

  ]

  return (
    <SafeAreaView>

      <Header 
          username={Users[0].username}
          avatar={Users[0].avatar}
      />

      <SearchBar />

      {Groups.map((group) => (
        <Chat 
          key={group.id}
          title={group.title}
          icon={group.icon}
        />
      ))}
      
    </SafeAreaView>
  );
}
