import { Alert } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Sighting } from "../types";
import { SightingCard } from "./SightingCard";

const sighting: Sighting = {
  sighting_id: "id-1",
  tops_number: "37025",
  class_number: "37",
  location_spotted: "Glasgow Central",
  location_destination: "Edinburgh Waverley",
  photo_uri: null,
  spotted_at: "2026-10-05T10:00:00.000Z",
};

describe("SightingCard", () => {
  afterEach(() => jest.restoreAllMocks());

  it("shows sighting details, location, destination, and fallback train art", () => {
    render(<SightingCard sighting={sighting} onDelete={jest.fn()} />);

    expect(screen.getByText("37025")).toBeTruthy();
    expect(screen.getByText("CLASS 37")).toBeTruthy();
    expect(screen.getByText("Glasgow Central")).toBeTruthy();
    expect(screen.getByText("Edinburgh Waverley")).toBeTruthy();
    expect(screen.getByText("train-outline")).toBeTruthy();
    expect(screen.getByText("5 Oct 2026")).toBeTruthy();
  });

  it("shows the photo and fallback location when optional fields are missing", () => {
    render(
      <SightingCard
        sighting={{
          ...sighting,
          location_spotted: null,
          location_destination: null,
          photo_uri: "file:///photo.jpg",
        }}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.getByText("Location not added")).toBeTruthy();
    expect(screen.queryByText("Edinburgh Waverley")).toBeNull();
    expect(screen.queryByText("train-outline")).toBeNull();
  });

  it("offers a keep action without deleting the sighting", () => {
    const alert = jest.spyOn(Alert, "alert");
    const onDelete = jest.fn();
    render(<SightingCard sighting={sighting} onDelete={onDelete} />);
    fireEvent.press(screen.getByRole("button", { name: "Options for 37025" }));

    const buttons = alert.mock.calls[0][2]!;
    buttons[0].onPress?.();
    expect(alert).toHaveBeenCalledWith(
      "Remove this sighting?",
      "Class 37 · 37025",
      expect.any(Array),
    );
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("deletes the sighting when removal is confirmed", () => {
    const alert = jest.spyOn(Alert, "alert");
    const onDelete = jest.fn();
    render(<SightingCard sighting={sighting} onDelete={onDelete} />);
    fireEvent.press(screen.getByRole("button", { name: "Options for 37025" }));

    alert.mock.calls[0][2]![1].onPress?.();

    expect(onDelete).toHaveBeenCalledWith(sighting);
  });
});
