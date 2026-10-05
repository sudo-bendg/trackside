import { render, screen } from "@testing-library/react-native";
import type { Sighting } from "../types";
import { ProfileScreen } from "./ProfileScreen";

const makeSighting = (
  id: string,
  classNumber: string,
  photoUri: string | null = null,
  spottedAt = "2026-10-05T10:00:00.000Z",
): Sighting => ({
  sighting_id: id,
  tops_number: `${classNumber}025`,
  class_number: classNumber,
  location_spotted: null,
  location_destination: null,
  photo_uri: photoUri,
  spotted_at: spottedAt,
});

describe("ProfileScreen", () => {
  it("renders empty collection statistics and the first-sighting prompt", () => {
    render(<ProfileScreen sightings={[]} />);

    expect(screen.getByText("The spotter")).toBeTruthy();
    expect(screen.getAllByText("0")).toHaveLength(3);
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("Your first one is waiting")).toBeTruthy();
  });

  it("shows unique classes, photo count, first sighting, and most-seen class", () => {
    const sightings = [
      makeSighting("third", "66", "file:///third.jpg", "2026-10-05T10:00:00.000Z"),
      makeSighting("second", "37"),
      makeSighting("first", "37", "file:///first.jpg", "2026-10-01T10:00:00.000Z"),
    ];

    render(<ProfileScreen sightings={sightings} />);

    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText("1 Oct 2026")).toBeTruthy();
    expect(screen.getByText("Class 37")).toBeTruthy();
  });

  it("uses the first class in input order to resolve a most-seen tie", () => {
    render(
      <ProfileScreen
        sightings={[makeSighting("first", "66"), makeSighting("second", "37")]}
      />,
    );

    expect(screen.getByText("Class 66")).toBeTruthy();
  });
});
