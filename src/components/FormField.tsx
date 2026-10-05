import { Text, TextInput, View, type TextInputProps } from "react-native";
import { COLORS } from "../theme";
import { styles } from "../styles";

type FormFieldProps = Omit<TextInputProps, "value" | "onChangeText" | "placeholder"> & {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

export function FormField({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  ...inputProps
}: FormFieldProps) {
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
