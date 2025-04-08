import { Notification } from "@/types/types";

export const sampleNotifications: Notification[] = [
  {
    id: "1",
    type: "invite",
    content: "You were invited to #group1",
    read: false,
  },
  {
    id: "2",
    type: "mention",
    content: "You were mentioned in #group2",
    read: false,
  },
  {
    id: "3",
    type: "announcement",
    content: "You get a new announcement from #group1 .",
    read: true,
  },

  {
    id: "4",
    type: "kick",
    content: "You were removed from #group3",
    read: true,
  },
  {
    id: "5",
    type: "mention",
    content: "You were mentioned in #group4",
    read: false,
  },
  {
    id: "6",
    type: "announcement",
    content: "You get a new announcement from #group4.",
    read: true,
  },

  {
    id: "7",
    type: "invite",
    content: "You were invited to #group5",
    read: false,
  },
  {
    id: "8",
    type: "kick",
    content: "You were removed from #group6",
    read: true,
  },
];
