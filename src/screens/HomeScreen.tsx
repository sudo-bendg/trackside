import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Sighting } from "../types";
import { formatDate } from "../utils";
import { COLORS } from "../theme";
import { styles } from "../styles";
import { SightingCard } from "../components/SightingCard";
import { getPressableStyle } from "../pressableStyle";

type HomeScreenProps = {
  sightings: Sighting[];
  onLog: () => void;
  onDelete: (sighting: Sighting) => void;
  onRefresh: () => void;
  loading: boolean;
};

export function HomeScreen({ sightings, onLog, onDelete, onRefresh, loading }: HomeScreenProps) {
  const uniqueClasses = useMemo(
    () => new Set(sightings.map((sighting) => sighting.class_number)).size,
    [sightings],
  );
  const recentSightings = sightings.slice(0, 20);

  return (
    <ScrollView
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.green} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            {formatDate(new Date().toISOString(), {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).toUpperCase()}
          </Text>
          <Text style={styles.greeting}>Hi, spotter</Text>
        </View>
        <View style={styles.headerMark}>
          <Ionicons name="train" size={22} color={COLORS.white} />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryText}>
          <Text style={styles.summaryEyebrow}>YOUR TRAIN JOURNAL</Text>
          <Text style={styles.summaryTitle}>Your sightings, in one place.</Text>
        </View>
        <View style={styles.summaryIllustration}>
          <Ionicons name="train" size={42} color="#D5E1D5" />
        </View>
        <View style={styles.summaryStats}>
          <View>
            <Text style={styles.summaryNumber}>{sightings.length}</Text>
            <Text style={styles.summaryLabel}>SIGHTINGS</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text style={styles.summaryNumber}>{uniqueClasses}</Text>
            <Text style={styles.summaryLabel}>CLASSES</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log a train sighting"
            style={({ pressed }) => getPressableStyle(styles.summaryAdd, pressed)}
            onPress={onLog}
          >
            <Ionicons name="add" size={23} color={COLORS.greenDark} />
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Recent sightings</Text>
          <Text style={styles.sectionSubtitle}>
            {sightings.length === 0
              ? "Your trainspotting story starts here"
              : `${sightings.length} logged on this device`}
          </Text>
        </View>
      </View>

      {recentSightings.length > 0 ? (
        <View style={styles.sightingList}>
          {recentSightings.map((sighting) => (
            <SightingCard
              key={sighting.sighting_id}
              sighting={sighting}
              onDelete={onDelete}
            />
          ))}
          {sightings.length > recentSightings.length ? (
            <Text style={styles.listLimitNote}>
              Showing your 20 most recent sightings.
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="binoculars-outline" size={28} color={COLORS.green} />
          </View>
          <Text style={styles.emptyTitle}>Nothing on the board. Yet.</Text>
          <Text style={styles.emptyCopy}>
            Spotted something on the rails? Add the number, snap a photo, and
            start your very own train journal.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => getPressableStyle(styles.primaryButton, pressed)}
            onPress={onLog}
          >
            <Ionicons name="add" size={19} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Log your first sighting</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.privacyNote}>
        <Ionicons name="phone-portrait-outline" size={13} color={COLORS.muted} />{" "}
        Your journal is saved on this device
      </Text>
    </ScrollView>
  );
}
