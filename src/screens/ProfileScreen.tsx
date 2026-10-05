import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Sighting } from "../types";
import { formatDate, getMostSeenClass } from "../utils";
import { COLORS } from "../theme";
import { styles } from "../styles";

type ProfileScreenProps = { sightings: Sighting[] };

export function ProfileScreen({ sightings }: ProfileScreenProps) {
  const classes = useMemo(
    () => new Set(sightings.map((sighting) => sighting.class_number)),
    [sightings],
  );
  const withPhotos = sightings.filter((sighting) => sighting.photo_uri).length;
  const firstSighting = sightings.length
    ? formatDate(sightings[sightings.length - 1].spotted_at)
    : "—";
  const mostSeenClass = getMostSeenClass(sightings);

  return (
    <ScrollView
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR CORNER OF THE RAILWAY</Text>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>
        <View style={styles.headerMark}>
          <Ionicons name="person-outline" size={23} color={COLORS.white} />
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Ionicons name="train" size={30} color={COLORS.green} />
        </View>
        <Text style={styles.profileName}>The spotter</Text>
        <View style={styles.localBadge}>
          <Ionicons name="phone-portrait-outline" size={13} color={COLORS.green} />
          <Text style={styles.localBadgeText}>LOCAL JOURNAL</Text>
        </View>
        <View style={styles.profileRule} />
        <View style={styles.profileStats}>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatNumber}>{sightings.length}</Text>
            <Text style={styles.profileStatLabel}>SIGHTINGS</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStat}>
            <Text style={styles.profileStatNumber}>{classes.size}</Text>
            <Text style={styles.profileStatLabel}>CLASSES</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStat}>
            <Text style={styles.profileStatNumber}>{withPhotos}</Text>
            <Text style={styles.profileStatLabel}>PHOTOS</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Your journey</Text>
          <Text style={styles.sectionSubtitle}>The story so far</Text>
        </View>
      </View>
      <View style={styles.journeyCard}>
        <View style={styles.journeyRow}>
          <View style={styles.journeyIcon}><Ionicons name="calendar-outline" size={18} color={COLORS.green} /></View>
          <View style={styles.journeyCopy}>
            <Text style={styles.journeyLabel}>First sighting</Text>
            <Text style={styles.journeyValue}>{firstSighting}</Text>
          </View>
        </View>
        <View style={styles.journeyRule} />
        <View style={styles.journeyRow}>
          <View style={styles.journeyIcon}><Ionicons name="albums-outline" size={18} color={COLORS.green} /></View>
          <View style={styles.journeyCopy}>
            <Text style={styles.journeyLabel}>Most-spotted class</Text>
            <Text style={styles.journeyValue}>
              {mostSeenClass
                ? `Class ${mostSeenClass}`
                : "Your first one is waiting"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.aboutCard}>
        <View style={styles.aboutIcon}><Ionicons name="heart-outline" size={19} color={COLORS.orange} /></View>
        <View style={styles.aboutCopy}>
          <Text style={styles.aboutTitle}>Built for the love of trains</Text>
          <Text style={styles.aboutText}>
            Your sightings and photos stay on your device. Sharing with the community is under development. Thanks for using Trackside.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
