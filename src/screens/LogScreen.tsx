import { useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { Ionicons } from "@expo/vector-icons";
import { saveSighting } from "../database";
import { getClassNumber, getErrorMessage } from "../utils";
import { COLORS } from "../theme";
import { styles } from "../styles";
import { FormField } from "../components/FormField";

type LogScreenProps = { onSaved: () => Promise<void> };

export function LogScreen({ onSaved }: LogScreenProps) {
  const database = useSQLiteContext();
  const [topsNumber, setTopsNumber] = useState("");
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const choosePhoto = async (source: "camera" | "library") => {
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
      const selectedAsset = result.assets?.[0];
      if (!result.canceled && selectedAsset) {
        setPhotoUri(selectedAsset.uri);
      }
    } catch (error) {
      Alert.alert("Couldn’t open photos", getErrorMessage(error));
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
        if (!FileSystem.documentDirectory) {
          throw new Error("App storage is unavailable.");
        }
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
      await onSaved();
    } catch (error) {
      Alert.alert("Couldn’t save your sighting", getErrorMessage(error));
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

        <View style={styles.formCard}>
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
