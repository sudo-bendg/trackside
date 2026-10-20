import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import { editSighting } from "../database";
import { getClassNumber, getErrorMessage } from "../utils";
import type { Sighting } from "../types";
import { COLORS } from "../theme";
import { styles } from "../styles";
import { getPressableStyle } from "../pressableStyle";
import { FormField } from "./FormField";

type EditSightingModalProps = {
    sighting: Sighting | null;
    visible: boolean;
    onClose: () => void;
    onSaved: () => Promise<void>;
};

type EditSightingModalContentProps = {
    topsNumber: string;
    location: string;
    destination: string;
    classNumber: string | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: () => void;
    onTopsNumberChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onDestinationChange: (value: string) => void;
};

function EditSightingModalContent({
    topsNumber,
    location,
    destination,
    classNumber,
    saving,
    onClose,
    onSubmit,
    onTopsNumberChange,
    onLocationChange,
    onDestinationChange,
}: EditSightingModalContentProps) {
    return (
        <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.eyebrow}>YOUR TRAIN JOURNAL</Text>
                        <Text style={styles.modalTitle}>Edit sighting</Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close edit sighting"
                        onPress={onClose}
                        style={({ pressed }) => getPressableStyle(styles.modalClose, pressed)}
                    >
                        <Ionicons name="close" size={21} color={COLORS.ink} />
                    </Pressable>
                </View>

                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <FormField
                        label="TOPS number"
                        hint="4–6 digits"
                        value={topsNumber}
                        onChangeText={onTopsNumberChange}
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
                        onChangeText={onLocationChange}
                        placeholder="e.g. Glasgow Central"
                        returnKeyType="next"
                    />
                    <FormField
                        label="Destination"
                        hint="OPTIONAL"
                        value={destination}
                        onChangeText={onDestinationChange}
                        placeholder="e.g. Edinburgh Waverley"
                        returnKeyType="done"
                    />
                </ScrollView>

                <View style={styles.modalActions}>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onClose}
                        style={({ pressed }) => getPressableStyle(styles.modalCancelButton, pressed)}
                    >
                        <Text style={styles.modalCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Save changes"
                        disabled={saving}
                        onPress={onSubmit}
                        style={({ pressed }) => [
                            ...getPressableStyle(styles.primaryButton, pressed),
                            styles.modalSaveButton,
                            saving && styles.disabledButton,
                        ]}
                    >
                        {saving ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="bookmark-outline" size={18} color={COLORS.white} />
                                <Text style={styles.primaryButtonText}>Save changes</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

export function EditSightingModal({ sighting, visible, onClose, onSaved }: EditSightingModalProps) {
    const database = useSQLiteContext();
    const [topsNumber, setTopsNumber] = useState(sighting?.tops_number ?? "");
    const [location, setLocation] = useState(sighting?.location_spotted ?? "");
    const [destination, setDestination] = useState(sighting?.location_destination ?? "");
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!sighting) return;

        const normalizedNumber = topsNumber.replace(/\D/g, "");
        if (!/^\d{4,6}$/.test(normalizedNumber)) {
            Alert.alert("Check the train number", "Enter a 4, 5, or 6 digit TOPS number.");
            return;
        }

        setSaving(true);
        try {
            await editSighting(database, {
                ...sighting,
                tops_number: normalizedNumber,
                class_number: getClassNumber(normalizedNumber),
                location_spotted: location.trim(),
                location_destination: destination.trim(),
            });
            await onSaved();
            onClose();
        } catch (error) {
            Alert.alert("Couldn’t save your changes", getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const normalizedNumber = topsNumber.replace(/\D/g, "");
    const classNumber = /^\d{4,6}$/.test(normalizedNumber)
        ? getClassNumber(normalizedNumber)
        : null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <EditSightingModalContent
                topsNumber={topsNumber}
                location={location}
                destination={destination}
                classNumber={classNumber}
                saving={saving}
                onClose={onClose}
                onSubmit={submit}
                onTopsNumberChange={(value) => setTopsNumber(value.replace(/\D/g, "").slice(0, 6))}
                onLocationChange={setLocation}
                onDestinationChange={setDestination}
            />
        </Modal>
    );
}