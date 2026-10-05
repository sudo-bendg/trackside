jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name),
  };
});

jest.mock("expo-status-bar", () => {
  const React = require("react");
  return { StatusBar: () => React.createElement(React.Fragment) };
});

jest.mock("expo-sqlite", () => {
  const React = require("react");
  return {
    SQLiteProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useSQLiteContext: jest.fn(),
    openDatabaseAsync: jest.fn(),
  };
});

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => {
  let documentDirectory: string | null = "/documents/";
  return {
    get documentDirectory() {
      return documentDirectory;
    },
    setDocumentDirectory(value: string | null) {
      documentDirectory = value;
    },
    makeDirectoryAsync: jest.fn(),
    copyAsync: jest.fn(),
    deleteAsync: jest.fn(),
  };
});

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "test-sighting-id"),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});
