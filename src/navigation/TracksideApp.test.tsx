import { Alert } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as FileSystem from "expo-file-system/legacy";
import { useSQLiteContext } from "expo-sqlite";
import { deleteSighting, getSightings } from "../database";
import type { Sighting } from "../types";
import { TracksideApp } from "./TracksideApp";

jest.mock("../database", () => ({
  deleteSighting: jest.fn(),
  getSightings: jest.fn(),
  initializeDatabase: jest.fn(),
  saveSighting: jest.fn(),
}));

const mockGetSightings = jest.mocked(getSightings);
const mockDeleteSighting = jest.mocked(deleteSighting);
const mockUseSQLiteContext = jest.mocked(useSQLiteContext);
const mockFileSystem = jest.requireMock("expo-file-system/legacy") as {
  setDocumentDirectory: (directory: string | null) => void;
};

const makeSighting = (photoUri: string | null = null): Sighting => ({
  sighting_id: "id-1",
  tops_number: "37025",
  class_number: "37",
  location_spotted: "Glasgow Central",
  location_destination: null,
  photo_uri: photoUri,
  spotted_at: "2026-10-05T10:00:00.000Z",
});

function confirmRemoval() {
  const alert = jest.spyOn(Alert, "alert");
  fireEvent.press(screen.getByRole("button", { name: "Options for 37025" }));
  alert.mock.calls.at(-1)?.[2]?.[1].onPress?.();
  return alert;
}

describe("TracksideApp", () => {
  beforeEach(() => {
    mockUseSQLiteContext.mockReturnValue({} as ReturnType<typeof useSQLiteContext>);
    mockGetSightings.mockResolvedValue([]);
    mockDeleteSighting.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockFileSystem.setDocumentDirectory("/documents/");
  });

  it("loads home, switches screens, refreshes, and returns to home after a save", async () => {
    const alert = jest.spyOn(Alert, "alert");
    const sighting = makeSighting();
    mockGetSightings.mockResolvedValueOnce([]).mockResolvedValueOnce([sighting]);
    render(<TracksideApp />);

    await waitFor(() => expect(screen.getByText("Recent sightings")).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: "Log a train sighting" }));
    expect(screen.getByText("TOPS number")).toBeTruthy();
    fireEvent.press(screen.getByText("Home"));
    fireEvent.press(screen.getByText("Profile"));
    expect(screen.getByText("Your journey")).toBeTruthy();
    fireEvent.press(screen.getByText("Log"));
    expect(screen.getByText("TOPS number")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("e.g. 37025"), "37025");
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Save sighting" }));
    });

    await waitFor(() => expect(screen.getByText("37025")).toBeTruthy());
    expect(mockGetSightings).toHaveBeenCalledTimes(2);
    expect(alert).not.toHaveBeenCalled();
  });

  it("reports initial database read failures", async () => {
    const alert = jest.spyOn(Alert, "alert");
    mockGetSightings.mockRejectedValueOnce(new Error("database offline"));

    render(<TracksideApp />);

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Couldn’t load your journal",
        "database offline",
      ),
    );
  });

  it("deletes a sighting and removes its app-owned photo", async () => {
    const sighting = makeSighting("/documents/sighting-photos/id-1.jpg");
    mockGetSightings.mockResolvedValue([sighting]);
    render(<TracksideApp />);
    await waitFor(() => expect(screen.getByText("37025")).toBeTruthy());

    const alert = confirmRemoval();
    await waitFor(() => expect(mockDeleteSighting).toHaveBeenCalledWith({}, "id-1"));

    expect(alert).toHaveBeenCalledTimes(1);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(sighting.photo_uri, {
      idempotent: true,
    });
  });

  it("does not delete a photo outside the app document directory", async () => {
    mockGetSightings.mockResolvedValue([makeSighting("content://external/photo.jpg")]);
    render(<TracksideApp />);
    await waitFor(() => expect(screen.getByText("37025")).toBeTruthy());

    confirmRemoval();

    await waitFor(() => expect(mockDeleteSighting).toHaveBeenCalled());
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it("skips photo cleanup when document storage is unavailable", async () => {
    mockFileSystem.setDocumentDirectory(null);
    mockGetSightings.mockResolvedValue([makeSighting("/documents/photo.jpg")]);
    render(<TracksideApp />);
    await waitFor(() => expect(screen.getByText("37025")).toBeTruthy());

    confirmRemoval();

    await waitFor(() => expect(mockDeleteSighting).toHaveBeenCalled());
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it("reports database deletion failures", async () => {
    const alert = jest.spyOn(Alert, "alert");
    mockGetSightings.mockResolvedValue([makeSighting()]);
    mockDeleteSighting.mockRejectedValueOnce(new Error("delete failed"));
    render(<TracksideApp />);
    await waitFor(() => expect(screen.getByText("37025")).toBeTruthy());

    confirmRemoval();

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith("Couldn’t remove this sighting", "delete failed"),
    );
  });

  it("reports photo cleanup failures after the sighting was removed", async () => {
    const alert = jest.spyOn(Alert, "alert");
    mockGetSightings.mockResolvedValue([makeSighting("/documents/photo.jpg")]);
    jest.mocked(FileSystem.deleteAsync).mockRejectedValueOnce(new Error("cleanup failed"));
    render(<TracksideApp />);
    await waitFor(() => expect(screen.getByText("37025")).toBeTruthy());

    confirmRemoval();

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Sighting removed",
        "Its photo couldn’t be removed: cleanup failed",
      ),
    );
  });
});
