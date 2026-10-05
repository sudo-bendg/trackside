import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { saveSighting } from "../database";
import { LogScreen } from "./LogScreen";

jest.mock("../database", () => ({ saveSighting: jest.fn() }));

const mockSaveSighting = jest.mocked(saveSighting);
const mockUseSQLiteContext = jest.mocked(useSQLiteContext);
const mockRandomUUID = jest.mocked(Crypto.randomUUID);
const mockCameraPermission = jest.mocked(ImagePicker.requestCameraPermissionsAsync);
const mockLibraryPermission = jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync);
const mockLaunchCamera = jest.mocked(ImagePicker.launchCameraAsync);
const mockLaunchLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const mockMakeDirectory = jest.mocked(FileSystem.makeDirectoryAsync);
const mockCopyFile = jest.mocked(FileSystem.copyAsync);
function setDocumentDirectory(value: string | null) {
  const filesystem = jest.requireMock("expo-file-system/legacy") as {
    setDocumentDirectory: (directory: string | null) => void;
  };
  filesystem.setDocumentDirectory(value);
  expect(FileSystem.documentDirectory).toBe(value);
}

async function saveForm() {
  await act(async () => {
    fireEvent.press(screen.getByRole("button", { name: "Save sighting" }));
  });
}

async function openPhotoPicker(option: 1 | 2) {
  const alert = jest.spyOn(Alert, "alert");
  fireEvent.press(screen.getByText("Add a photo"));
  const actions = alert.mock.calls.at(-1)?.[2];
  await act(async () => {
    await actions?.[option].onPress?.();
  });
}

function enterNumber(number: string) {
  fireEvent.changeText(screen.getByPlaceholderText("e.g. 37025"), number);
}

describe("LogScreen", () => {
  beforeEach(() => {
    setDocumentDirectory("/documents/");
    mockUseSQLiteContext.mockReturnValue({} as ReturnType<typeof useSQLiteContext>);
    mockRandomUUID.mockReturnValue("test-sighting-id");
    mockSaveSighting.mockResolvedValue(undefined);
    mockCameraPermission.mockResolvedValue({ granted: true } as never);
    mockLibraryPermission.mockResolvedValue({ granted: true } as never);
    mockLaunchCamera.mockResolvedValue({ canceled: true, assets: null } as never);
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null } as never);
    mockMakeDirectory.mockResolvedValue(undefined);
    mockCopyFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    setDocumentDirectory("/documents/");
  });

  it("renders the log form and local-storage reassurance", () => {
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByText("Log a sighting")).toBeTruthy();
    expect(screen.getByText("TOPS number")).toBeTruthy();
    expect(screen.getByText("Location spotted")).toBeTruthy();
    expect(screen.getByText("Destination")).toBeTruthy();
    expect(screen.getByText(/Saved privately on this device/)).toBeTruthy();
  });

  it("uses Android keyboard-avoidance behavior on Android", () => {
    jest.replaceProperty(Platform, "OS", "android");
    const view = render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);

    expect(view.UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBeUndefined();
  });


  it.each([
    ["123", "123"],
    ["12ab", "12"],
    ["1234567", "123456"],
  ])("validates and bounds entered TOPS values (%s)", (value, expected) => {
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    enterNumber(value);

    expect(screen.getByPlaceholderText("e.g. 37025").props.value).toBe(expected);
    expect(mockSaveSighting).not.toHaveBeenCalled();
  });

  it("rejects an invalid number without writing to SQLite", async () => {
    const alert = jest.spyOn(Alert, "alert");
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///library/train.png" }],
    } as never);
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    enterNumber("123");

    await saveForm();

    expect(alert).toHaveBeenCalledWith(
      "Check the train number",
      "Enter a 4, 5, or 6 digit TOPS number.",
    );
    expect(mockSaveSighting).not.toHaveBeenCalled();
  });

  it.each([
    ["3702", "Class 37"],
    ["37025", "Class 37"],
    ["334002", "Class 334"],
  ])("derives a class preview for %s", (number, expected) => {
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    enterNumber(number);

    expect(screen.getByText(expected)).toBeTruthy();
  });

  it("saves the normalized number and optional fields, resets the form, and returns home", async () => {
    const onSaved = jest.fn().mockResolvedValue(undefined);
    render(<LogScreen onSaved={onSaved} />);
    enterNumber("37025");
    fireEvent.changeText(screen.getByPlaceholderText("e.g. Glasgow Central"), " Glasgow Central ");
    fireEvent.changeText(
      screen.getByPlaceholderText("e.g. Edinburgh Waverley"),
      " Edinburgh Waverley ",
    );

    await saveForm();

    expect(mockSaveSighting).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        sighting_id: "test-sighting-id",
        tops_number: "37025",
        class_number: "37",
        location_spotted: "Glasgow Central",
        location_destination: "Edinburgh Waverley",
        photo_uri: null,
      }),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText("e.g. 37025").props.value).toBe("");
  });

  it("saves with blank optional fields when omitted", async () => {
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    enterNumber("334002");

    await saveForm();

    expect(mockSaveSighting).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        tops_number: "334002",
        class_number: "334",
        location_spotted: "",
        location_destination: "",
      }),
    );
  });

  it("requests camera access and attaches a captured photo", async () => {
    mockLaunchCamera.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///camera/train.jpeg" }],
    } as never);
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    enterNumber("37025");

    await openPhotoPicker(1);
    expect(mockCameraPermission).toHaveBeenCalledTimes(1);
    expect(mockLaunchCamera).toHaveBeenCalledWith({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    expect(screen.getByLabelText("Remove photo")).toBeTruthy();
    await saveForm();

    expect(mockMakeDirectory).toHaveBeenCalledWith(
      "/documents/sighting-photos/",
      { intermediates: true },
    );
    expect(mockCopyFile).toHaveBeenCalledWith({
      from: "file:///camera/train.jpeg",
      to: "/documents/sighting-photos/test-sighting-id.jpeg",
    });
    expect(mockSaveSighting).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        photo_uri: "/documents/sighting-photos/test-sighting-id.jpeg",
      }),
    );
  });

  it("requests library access and attaches an image from the library", async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///library/train.png" }],
    } as never);
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);

    await openPhotoPicker(2);

    expect(mockLibraryPermission).toHaveBeenCalledTimes(1);
    expect(mockLaunchLibrary).toHaveBeenCalledWith({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    expect(screen.getByLabelText("Remove photo")).toBeTruthy();
  });

  it("does not attach canceled selections or empty asset results", async () => {
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    await openPhotoPicker(2);
    expect(screen.queryByLabelText("Remove photo")).toBeNull();

    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [],
    } as never);
    await openPhotoPicker(2);
    expect(screen.queryByLabelText("Remove photo")).toBeNull();
  });

  it("removes an attached image before saving", async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///library/train.png" }],
    } as never);
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    await openPhotoPicker(2);

    fireEvent.press(screen.getByLabelText("Remove photo"));

    expect(screen.getByText("Add a photo")).toBeTruthy();
    expect(screen.queryByLabelText("Remove photo")).toBeNull();
  });

  it.each([
    ["camera", "requestCameraPermissionsAsync"],
    ["library", "requestMediaLibraryPermissionsAsync"],
  ])("reports denied %s permission", async (source) => {
    const alert = jest.spyOn(Alert, "alert");
    mockCameraPermission.mockResolvedValue({ granted: false } as never);
    mockLibraryPermission.mockResolvedValue({ granted: false } as never);
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);

    await openPhotoPicker(source === "camera" ? 1 : 2);

    expect(alert).toHaveBeenCalledWith(
      "Permission needed",
      source === "camera"
        ? "Allow camera access in Settings to take a photo."
        : "Allow photo library access in Settings to attach a picture.",
    );
    expect(mockLaunchCamera).not.toHaveBeenCalled();
    expect(mockLaunchLibrary).not.toHaveBeenCalled();
  });

  it("reports errors from permission and image-picker calls", async () => {
    const alert = jest.spyOn(Alert, "alert");
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    mockCameraPermission.mockRejectedValueOnce(new Error("camera permission error"));
    await openPhotoPicker(1);
    expect(alert).toHaveBeenCalledWith("Couldn’t open photos", "camera permission error");

    mockLibraryPermission.mockRejectedValueOnce("library permission error");
    await openPhotoPicker(2);
    expect(alert).toHaveBeenCalledWith(
      "Couldn’t open photos",
      "library permission error",
    );

    mockLaunchLibrary.mockRejectedValueOnce(new Error("picker error"));
    await openPhotoPicker(2);
    expect(alert).toHaveBeenCalledWith("Couldn’t open photos", "picker error");
  });

  it("uses the jpg fallback when the chosen file has no extension", async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///library/no-extension" }],
    } as never);
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    enterNumber("37025");
    await openPhotoPicker(2);
    await saveForm();

    expect(mockCopyFile).toHaveBeenCalledWith({
      from: "file:///library/no-extension",
      to: "/documents/sighting-photos/test-sighting-id.jpg",
    });
  });

  it("reports unavailable storage and file errors when saving a photo", async () => {
    const alert = jest.spyOn(Alert, "alert");
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///library/train.png" }],
    } as never);
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    enterNumber("37025");
    await openPhotoPicker(2);
    expect(screen.getByLabelText("Remove photo")).toBeTruthy();

    setDocumentDirectory(null);
    await saveForm();
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Couldn’t save your sighting",
        "App storage is unavailable.",
      ),
    );

    setDocumentDirectory("/documents/");
    mockMakeDirectory.mockRejectedValueOnce(new Error("mkdir failed"));
    await saveForm();
    expect(alert).toHaveBeenCalledWith("Couldn’t save your sighting", "mkdir failed");

    mockCopyFile.mockRejectedValueOnce(new Error("copy failed"));
    await saveForm();
    expect(alert).toHaveBeenCalledWith("Couldn’t save your sighting", "copy failed");
  });

  it("reports persistence and completion-callback errors", async () => {
    const alert = jest.spyOn(Alert, "alert");
    render(<LogScreen onSaved={jest.fn().mockRejectedValue(new Error("refresh failed"))} />);
    enterNumber("37025");
    mockSaveSighting.mockRejectedValueOnce("database failed");
    await saveForm();
    expect(alert).toHaveBeenCalledWith("Couldn’t save your sighting", "database failed");

    await saveForm();
    expect(alert).toHaveBeenCalledWith("Couldn’t save your sighting", "refresh failed");
  });

  it("disables the save action and shows a spinner while persistence is pending", async () => {
    let finishSave!: () => void;
    mockSaveSighting.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        }),
    );
    render(<LogScreen onSaved={jest.fn().mockResolvedValue(undefined)} />);
    enterNumber("37025");
    fireEvent.press(screen.getByRole("button", { name: "Save sighting" }));

    await waitFor(() => expect(screen.queryByText("Save sighting")).toBeNull());
    expect(
      screen.getByRole("button", { name: "Save sighting" }).props.accessibilityState
        .disabled,
    ).toBe(true);
    await act(async () => finishSave());
  });
});
