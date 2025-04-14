import { AppNotification } from "@/types/types";

export const sampleNotifications: AppNotification[] = [
  {
    id: "1",
    type: "invite",
    content: "You were invited to #group1",
    read: false,
    targetGroupId: 1,
    groupName: "#group1",
  },
  {
    id: "2",
    type: "mention",
    content: "You were mentioned in #group2",
    read: false,
    targetGroupId: 2,
    groupName: "#group2",
  },
  {
    id: "3",
    type: "announcement",
    content: "You get a new announcement from #group1 .",
    read: true,
    targetGroupId: 1,
    groupName: "#group1",
  },

  {
    id: "4",
    type: "kick",
    content: "You were removed from #group3",
    read: true,
    targetGroupId: 3,
    groupName: "#group3",
  },
  {
    id: "5",
    type: "mention",
    content: "You were mentioned in #group4",
    read: false,
    targetGroupId: 4,
    groupName: "#group4",
  },
  {
    id: "6",
    type: "announcement",
    content: "You get a new announcement from #group4.",
    read: true,
    targetGroupId: 4,
    groupName: "#group4",
  },

  {
    id: "7",
    type: "invite",
    content: "You were invited to #group5",
    read: false,
    targetGroupId: 5,
    groupName: "#group5",
  },
  {
    id: "8",
    type: "kick",
    content: "You were removed from #group6",
    read: true,
    targetGroupId: 6,
    groupName: "#group6",
  },
];
