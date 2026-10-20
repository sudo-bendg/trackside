import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { editSighting } from "../database";
import type { Sighting } from "../types";
import { EditSightingModal } from "./EditSightingModal";

jest.mock("expo-sqlite", () => ({ useSQLiteContext: jest.fn() }));
jest.mock("../database", () => ({ editSighting: jest.fn() }));

const mockUseSQLiteContext = jest.mocked(useSQLiteContext);
const mockEditSighting = jest.mocked(editSighting);
const sighting: Sighting = {
  sighting_id: "id-1",
  tops_number: "37025",
  class_number: "37",
  location_spotted: "Glasgow Central",
  location_destination: "Edinburgh Waverley",
  photo_uri: "file:///photo.jpg",
  spotted_at: "2026-10-05T10:00:00.000Z",
};

describe("EditSightingModal", () => {
  beforeEach(() => {
    mockUseSQLiteContext.mockReturnValue({} as ReturnType<typeof useSQLiteContext>);
    mockEditSighting.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("prefills the form and saves updated fields while preserving photo and date", async () => {
    const onClose = jest.fn();
    const onSaved = jest.fn().mockResolvedValue(undefined);
    render(
      <EditSightingModal
        sighting={sighting}
        visible
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByDisplayValue("37025")).toBeTruthy();
    expect(screen.getByDisplayValue("Glasgow Central")).toBeTruthy();
    expect(screen.getByDisplayValue("Edinburgh Waverley")).toBeTruthy();
    fireEvent.changeText(screen.getByDisplayValue("37025"), "66008");
    fireEvent.changeText(screen.getByDisplayValue("Glasgow Central"), "York");
    fireEvent.press(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockEditSighting).toHaveBeenCalledWith({}, {
      ...sighting,
      tops_number: "66008",
      class_number: "66",
      location_spotted: "York",
    }));
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid TOPS number without saving", () => {
    const alert = jest.spyOn(Alert, "alert");
    render(
      <EditSightingModal
        sighting={sighting}
        visible
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    );
    fireEvent.changeText(screen.getByDisplayValue("37025"), "123");
    fireEvent.press(screen.getByRole("button", { name: "Save changes" }));

    expect(alert).toHaveBeenCalledWith(
      "Check the train number",
      "Enter a 4, 5, or 6 digit TOPS number.",
    );
    expect(mockEditSighting).not.toHaveBeenCalled();
  });
});