import { Alert, Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Sighting } from "../types";
import { formatDate } from "../utils";
import { COLORS } from "../theme";
import { styles } from "../styles";
import { IconButton } from "./IconButton";

type SightingCardProps = { sighting: Sighting; onDelete: (sighting: Sighting) => void };

export function SightingCard({ sighting, onDelete }: SightingCardProps) {
  return (
    <View style={styles.sightingCard}>
      {sighting.photo_uri ? (
        <Image source={{ uri: sighting.photo_uri }} style={styles.sightingPhoto} />
      ) : (
        <View style={styles.trainBadge}>
          <Ionicons name="train-outline" size={23} color={COLORS.green} />
        </View>
      )}
      <View style={styles.sightingDetails}>
        <View style={styles.sightingTopline}>
          <Text style={styles.topsNumber}>{sighting.tops_number}</Text>
          <View style={styles.classTag}>
            <Text style={styles.classTagText}>CLASS {sighting.class_number}</Text>
          </View>
        </View>
        <Text style={styles.sightingLocation} numberOfLines={1}>
          {sighting.location_spotted || "Location not added"}
        </Text>
        {sighting.location_destination ? (
          <View style={styles.destinationRow}>
            <Ionicons name="arrow-forward" size={12} color={COLORS.muted} />
            <Text style={styles.destinationText} numberOfLines={1}>
              {sighting.location_destination}
            </Text>
          </View>
        ) : null}
        <Text style={styles.sightingDate}>{formatDate(sighting.spotted_at)}</Text>
      </View>
      <IconButton
        name="ellipsis-horizontal"
        accessibilityLabel={`Options for ${sighting.tops_number}`}
        onPress={() =>
          Alert.alert(
            "Remove this sighting?",
            `Class ${sighting.class_number} · ${sighting.tops_number}`,
            [
              { text: "Keep it", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () => onDelete(sighting),
              },
            ],
          )
        }
        color={COLORS.muted}
      />
    </View>
  );
}
