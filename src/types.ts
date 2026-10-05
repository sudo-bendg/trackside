import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type Sighting = {
  sighting_id: string;
  tops_number: string;
  class_number: string;
  location_spotted: string | null;
  location_destination: string | null;
  photo_uri: string | null;
  spotted_at: string;
};

export type IconName = ComponentProps<typeof Ionicons>["name"];
