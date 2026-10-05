import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  deleteSighting,
  getSightings,
  initializeDatabase,
  saveSighting,
} from "./src/database";

const COLORS = {
  background: "#F6F5EF",
  white: "#FFFFFF",
  ink: "#182820",
  muted: "#7D877F",
  green: "#28583F",
  greenDark: "#183B2B",
  paleGreen: "#E8EFE8",
  orange: "#E68B52",
  line: "#E8E8E0",
  pale: "#F0F0E9",
};

const TABS = [
  { key: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { key: "log", label: "Log", icon: "add-circle-outline", activeIcon: "add-circle" },
  { key: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(value).toLocaleDateString("en-GB", options);
}

function getClassNumber(number) {
  return number.length === 6 ? number.slice(0, 3) : number.slice(0, 2);
}

function IconButton({ name, onPress, accessibilityLabel, color = COLORS.green }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={name} size={19} color={color} />
    </Pressable>
  );
}

function SightingCard({ sighting, onDelete }) {
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

function HomeScreen({ sightings, onLog, onDelete, onRefresh, loading }) {
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
          <Text style={styles.greeting}>Hi, spotter <Text style={styles.wave}>✳</Text></Text>
        </View>
        <View style={styles.headerMark}>
          <Ionicons name="train" size={22} color={COLORS.white} />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryText}>
          <Text style={styles.summaryEyebrow}>YOUR TRAIN JOURNAL</Text>
          <Text style={styles.summaryTitle}>Every train has{`\n`}a story.</Text>
          <Text style={styles.summaryCaption}>Your sightings, all in one place.</Text>
        </View>
        <View style={styles.summaryIllustration}>
          <Ionicons name="train" size={42} color="#D5E1D5" />
          <View style={styles.trackLine} />
          <View style={styles.trackLineShort} />
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
            style={({ pressed }) => [styles.summaryAdd, pressed && styles.pressed]}
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
              : `${sightings.length} logged locally on this device`}
          </Text>
        </View>
        {sightings.length > 0 ? (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>MY LOG</Text>
          </View>
        ) : null}
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
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
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

function FormField({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  ...inputProps
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0A69F"
        selectionColor={COLORS.green}
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

function LogScreen({ onSaved }) {
  const database = useSQLiteContext();
  const [topsNumber, setTopsNumber] = useState("");
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const choosePhoto = async (source) => {
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          source === "camera"
            ? "Allow camera access in Settings to take a photo."
            : "Allow photo library access in Settings to attach a picture.",
        );
        return;
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Couldn’t open photos", error.message);
    }
  };

  const addPhoto = () => {
    Alert.alert("Add a photo", "Capture this moment or choose a photo.", [
      { text: "Cancel", style: "cancel" },
      { text: "Take photo", onPress: () => choosePhoto("camera") },
      { text: "Choose from library", onPress: () => choosePhoto("library") },
    ]);
  };

  const submit = async () => {
    const normalizedNumber = topsNumber.replace(/\D/g, "");
    if (!/^\d{4,6}$/.test(normalizedNumber)) {
      Alert.alert("Check the train number", "Enter a 4, 5, or 6 digit TOPS number.");
      return;
    }

    setSaving(true);
    const id = Crypto.randomUUID();
    let savedPhotoUri = null;
    try {
      if (photoUri) {
        const extension = photoUri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1] || "jpg";
        const directory = `${FileSystem.documentDirectory}sighting-photos/`;
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        savedPhotoUri = `${directory}${id}.${extension}`;
        await FileSystem.copyAsync({ from: photoUri, to: savedPhotoUri });
      }
      await saveSighting(database, {
        sighting_id: id,
        tops_number: normalizedNumber,
        class_number: getClassNumber(normalizedNumber),
        location_spotted: location.trim(),
        location_destination: destination.trim(),
        photo_uri: savedPhotoUri,
        spotted_at: new Date().toISOString(),
      });
      setTopsNumber("");
      setLocation("");
      setDestination("");
      setPhotoUri(null);
      onSaved();
    } catch (error) {
      Alert.alert("Couldn’t save your sighting", error.message);
    } finally {
      setSaving(false);
    }
  };

  const classNumber = /^\d{4,6}$/.test(topsNumber.replace(/\D/g, ""))
    ? getClassNumber(topsNumber.replace(/\D/g, ""))
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        contentContainerStyle={styles.pageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR TRAIN JOURNAL</Text>
            <Text style={styles.pageTitle}>Log a sighting</Text>
          </View>
          <View style={styles.headerMark}>
            <Ionicons name="create-outline" size={23} color={COLORS.white} />
          </View>
        </View>
        <Text style={styles.formIntro}>
          The little details make the memory. Add as much or as little as you like.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.formStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>01</Text></View>
            <View>
              <Text style={styles.formSectionTitle}>The train</Text>
              <Text style={styles.formSectionCopy}>Start with its number</Text>
            </View>
          </View>
          <FormField
            label="TOPS number"
            hint="4–6 digits"
            value={topsNumber}
            onChangeText={(value) => setTopsNumber(value.replace(/\D/g, "").slice(0, 6))}
            placeholder="e.g. 37025"
            keyboardType="number-pad"
            maxLength={6}
            returnKeyType="next"
          />
          {classNumber ? (
            <View style={styles.classPreview}>
              <Ionicons name="sparkles-outline" size={15} color={COLORS.green} />
              <Text style={styles.classPreviewText}>
                Looks like a <Text style={styles.classPreviewStrong}>Class {classNumber}</Text>
              </Text>
            </View>
          ) : null}

          <View style={styles.formSeparator} />
          <View style={styles.formStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>02</Text></View>
            <View>
              <Text style={styles.formSectionTitle}>The moment</Text>
              <Text style={styles.formSectionCopy}>Where did you spot it?</Text>
            </View>
          </View>
          <FormField
            label="Location spotted"
            hint="OPTIONAL"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Glasgow Central"
            returnKeyType="next"
          />
          <FormField
            label="Destination"
            hint="OPTIONAL"
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Edinburgh Waverley"
            returnKeyType="done"
          />
          <View style={styles.dateNote}>
            <Ionicons name="time-outline" size={16} color={COLORS.green} />
            <Text style={styles.dateNoteText}>
              Date and time are added automatically when you save.
            </Text>
          </View>

          <View style={styles.formSeparator} />
          <View style={styles.formStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>03</Text></View>
            <View>
              <Text style={styles.formSectionTitle}>Keep the memory</Text>
              <Text style={styles.formSectionCopy}>A photo makes it yours</Text>
            </View>
          </View>
          {photoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                onPress={() => setPhotoUri(null)}
                style={styles.removePhoto}
              >
                <Ionicons name="close" size={17} color={COLORS.white} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={addPhoto}
              style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
            >
              <View style={styles.photoButtonIcon}>
                <Ionicons name="camera-outline" size={22} color={COLORS.green} />
              </View>
              <View style={styles.photoButtonTextWrap}>
                <Text style={styles.photoButtonTitle}>Add a photo</Text>
                <Text style={styles.photoButtonHint}>Take one or choose from your library</Text>
              </View>
              <Ionicons name="add" size={21} color={COLORS.green} />
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={submit}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.saveButton,
              pressed && styles.pressed,
              saving && styles.disabledButton,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="bookmark-outline" size={18} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Save sighting</Text>
              </>
            )}
          </Pressable>
        </View>
        <Text style={styles.formPrivacy}>
          <Ionicons name="lock-closed-outline" size={13} color={COLORS.muted} />{" "}
          Saved privately on this device
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileScreen({ sightings }) {
  const classes = useMemo(
    () => new Set(sightings.map((sighting) => sighting.class_number)),
    [sightings],
  );
  const withPhotos = sightings.filter((sighting) => sighting.photo_uri).length;
  const firstSighting = sightings.length
    ? formatDate(sightings[sightings.length - 1].spotted_at)
    : "—";

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
        <Text style={styles.profileBio}>A railway enthusiast, one sighting at a time.</Text>
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
              {sightings.length
                ? `Class ${Object.entries(
                    sightings.reduce((counts, sighting) => {
                      counts[sighting.class_number] =
                        (counts[sighting.class_number] || 0) + 1;
                      return counts;
                    }, {}),
                  ).sort((a, b) => b[1] - a[1])[0][0]}`
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
            Your sightings and photos stay on your device. Sharing and following
            are coming later; your journal works wherever the tracks take you.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function TracksideApp() {
  const database = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("home");
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshSightings = useCallback(async () => {
    setLoading(true);
    try {
      const records = await getSightings(database);
      setSightings(records);
    } catch (error) {
      Alert.alert("Couldn’t load your journal", error.message);
    } finally {
      setLoading(false);
    }
  }, [database]);

  useEffect(() => {
    refreshSightings();
  }, [refreshSightings]);

  const handleDelete = async (sighting) => {
    try {
      await deleteSighting(database, sighting.sighting_id);
      await refreshSightings();
      if (sighting.photo_uri?.startsWith(FileSystem.documentDirectory)) {
        try {
          await FileSystem.deleteAsync(sighting.photo_uri, { idempotent: true });
        } catch (error) {
          Alert.alert("Sighting removed", `Its photo couldn’t be removed: ${error.message}`);
        }
      }
    } catch (error) {
      Alert.alert("Couldn’t remove this sighting", error.message);
    }
  };

  const handleSaved = async () => {
    await refreshSightings();
    setActiveTab("home");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <View style={styles.flex}>
        {activeTab === "home" ? (
          <HomeScreen
            sightings={sightings}
            onLog={() => setActiveTab("log")}
            onDelete={handleDelete}
            onRefresh={refreshSightings}
            loading={loading}
          />
        ) : activeTab === "log" ? (
          <LogScreen onSaved={handleSaved} />
        ) : (
          <ProfileScreen sightings={sightings} />
        )}
      </View>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}
            >
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={21}
                color={active ? COLORS.green : COLORS.muted}
              />
              <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="trackside.db" onInit={initializeDatabase}>
        <TracksideApp />
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  pageContent: { paddingHorizontal: 22, paddingBottom: 28 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  header: {
    minHeight: 78,
    paddingTop: 12,
    paddingBottom: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  greeting: { color: COLORS.ink, fontSize: 28, lineHeight: 34, fontWeight: "700", marginTop: 3 },
  wave: { color: COLORS.orange, fontSize: 23 },
  pageTitle: { color: COLORS.ink, fontSize: 28, lineHeight: 34, fontWeight: "700", marginTop: 3 },
  headerMark: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    marginTop: 10,
    backgroundColor: COLORS.greenDark,
    borderRadius: 24,
    paddingHorizontal: 21,
    paddingTop: 22,
    paddingBottom: 17,
    overflow: "hidden",
  },
  summaryText: { zIndex: 1 },
  summaryEyebrow: { color: "#B8CBB9", fontSize: 9, fontWeight: "700", letterSpacing: 1.4 },
  summaryTitle: { color: COLORS.white, fontSize: 27, fontWeight: "700", lineHeight: 31, marginTop: 7 },
  summaryCaption: { color: "#CDDBCE", fontSize: 12, marginTop: 6 },
  summaryIllustration: { position: "absolute", right: 15, top: 34, opacity: 0.9, transform: [{ rotate: "-9deg" }] },
  trackLine: { backgroundColor: "#78927C", height: 2, width: 76, marginTop: 5 },
  trackLineShort: { backgroundColor: "#78927C", height: 2, width: 76, marginTop: 4 },
  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
    borderTopColor: "rgba(255,255,255,0.17)",
    borderTopWidth: 1,
    marginTop: 20,
    paddingTop: 13,
  },
  summaryNumber: { color: COLORS.white, fontSize: 20, fontWeight: "700" },
  summaryLabel: { color: "#B8CBB9", fontSize: 8, fontWeight: "700", letterSpacing: 1, marginTop: 1 },
  summaryDivider: { height: 29, width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 22 },
  summaryAdd: {
    width: 37,
    height: 37,
    borderRadius: 14,
    backgroundColor: "#D7E4D7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 27,
    marginBottom: 13,
  },
  sectionTitle: { color: COLORS.ink, fontSize: 18, fontWeight: "700" },
  sectionSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  livePill: {
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 9,
    backgroundColor: COLORS.paleGreen,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  liveText: { color: COLORS.green, fontSize: 8, fontWeight: "700", letterSpacing: 0.6 },
  sightingList: { gap: 10 },
  sightingCard: {
    minHeight: 89,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: "#EEEFE9",
  },
  sightingPhoto: { width: 62, height: 66, borderRadius: 12, backgroundColor: COLORS.pale },
  trainBadge: {
    width: 62,
    height: 66,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.paleGreen,
  },
  sightingDetails: { flex: 1, minWidth: 0 },
  sightingTopline: { flexDirection: "row", alignItems: "center", gap: 7 },
  topsNumber: { color: COLORS.ink, fontSize: 19, fontWeight: "700", letterSpacing: 0.3 },
  classTag: { backgroundColor: COLORS.pale, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 },
  classTagText: { color: COLORS.muted, fontSize: 7, fontWeight: "700", letterSpacing: 0.4 },
  sightingLocation: { color: "#49584E", fontSize: 11, fontWeight: "600", marginTop: 5 },
  destinationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  destinationText: { color: COLORS.muted, fontSize: 10, flexShrink: 1 },
  sightingDate: { color: "#939B94", fontSize: 9, marginTop: 4 },
  iconButton: { width: 29, height: 34, alignItems: "center", justifyContent: "center" },
  listLimitNote: { color: COLORS.muted, fontSize: 11, textAlign: "center", marginTop: 4 },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 21,
    paddingHorizontal: 22,
    paddingVertical: 25,
    alignItems: "center",
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "700", marginTop: 14 },
  emptyCopy: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 7 },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 17,
    backgroundColor: COLORS.green,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 17,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  privacyNote: { color: COLORS.muted, fontSize: 10, textAlign: "center", marginTop: 16 },
  formIntro: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 1, marginBottom: 17 },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "#EEEFE9",
  },
  formStep: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  stepNumber: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.paleGreen,
  },
  stepNumberText: { color: COLORS.green, fontSize: 10, fontWeight: "700" },
  formSectionTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "700" },
  formSectionCopy: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  field: { marginBottom: 13 },
  fieldLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  fieldLabel: { color: "#445249", fontSize: 11, fontWeight: "700" },
  fieldHint: { color: "#9BA29C", fontSize: 8, fontWeight: "700", letterSpacing: 0.6 },
  input: {
    height: 47,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: "#FCFCFA",
    color: COLORS.ink,
    paddingHorizontal: 13,
    fontSize: 13,
  },
  classPreview: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -4, marginBottom: 2 },
  classPreviewText: { color: COLORS.muted, fontSize: 10 },
  classPreviewStrong: { color: COLORS.green, fontWeight: "700" },
  formSeparator: { height: 1, backgroundColor: COLORS.line, marginVertical: 17 },
  dateNote: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    backgroundColor: "#F2F6F1",
    paddingHorizontal: 10,
    marginTop: 1,
  },
  dateNoteText: { color: "#58705F", fontSize: 10, flex: 1 },
  photoButton: {
    minHeight: 65,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 10,
  },
  photoButtonIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: COLORS.paleGreen, alignItems: "center", justifyContent: "center" },
  photoButtonTextWrap: { flex: 1 },
  photoButtonTitle: { color: COLORS.ink, fontSize: 11, fontWeight: "700" },
  photoButtonHint: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  photoPreviewWrap: { position: "relative", marginBottom: 1 },
  photoPreview: { width: "100%", height: 180, borderRadius: 14, backgroundColor: COLORS.pale },
  removePhoto: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: "rgba(24,40,32,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: { marginTop: 18, minHeight: 50 },
  disabledButton: { opacity: 0.7 },
  formPrivacy: { color: COLORS.muted, fontSize: 10, textAlign: "center", marginTop: 15 },
  profileCard: {
    marginTop: 11,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    alignItems: "center",
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 17,
    borderWidth: 1,
    borderColor: "#EEEFE9",
  },
  profileAvatar: {
    width: 66,
    height: 66,
    borderRadius: 23,
    backgroundColor: COLORS.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { color: COLORS.ink, fontSize: 18, fontWeight: "700", marginTop: 10 },
  profileBio: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  localBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.paleGreen,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 10,
  },
  localBadgeText: { color: COLORS.green, fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  profileRule: { alignSelf: "stretch", height: 1, backgroundColor: COLORS.line, marginTop: 19 },
  profileStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", alignSelf: "stretch", paddingTop: 15 },
  profileStat: { flex: 1, alignItems: "center" },
  profileStatNumber: { color: COLORS.ink, fontSize: 19, fontWeight: "700" },
  profileStatLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "700", letterSpacing: 0.7, marginTop: 3 },
  profileStatDivider: { width: 1, height: 28, backgroundColor: COLORS.line },
  journeyCard: { backgroundColor: COLORS.white, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: "#EEEFE9" },
  journeyRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11 },
  journeyIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: COLORS.paleGreen, alignItems: "center", justifyContent: "center" },
  journeyCopy: { flex: 1 },
  journeyLabel: { color: COLORS.muted, fontSize: 10 },
  journeyValue: { color: COLORS.ink, fontSize: 12, fontWeight: "700", marginTop: 3 },
  journeyRule: { height: 1, backgroundColor: COLORS.line, marginLeft: 48 },
  aboutCard: {
    flexDirection: "row",
    gap: 11,
    backgroundColor: "#FBF1E9",
    borderRadius: 17,
    padding: 14,
    marginTop: 14,
  },
  aboutIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#F8E4D3", alignItems: "center", justifyContent: "center" },
  aboutCopy: { flex: 1 },
  aboutTitle: { color: COLORS.ink, fontSize: 11, fontWeight: "700", marginTop: 1 },
  aboutText: { color: "#75685F", fontSize: 10, lineHeight: 15, marginTop: 5 },
  tabBar: {
    minHeight: 59,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 43 },
  tabLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "600" },
  activeTabLabel: { color: COLORS.green, fontWeight: "700" },
});
