import { RefreshControl } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Sighting } from "../types";
import { HomeScreen } from "./HomeScreen";

const makeSighting = (id: number, classNumber = "37"): Sighting => ({
  sighting_id: `sighting-${id}`,
  tops_number: `${classNumber}${String(id).padStart(3, "0")}`,
  class_number: classNumber,
  location_spotted: "Glasgow Central",
  location_destination: null,
  photo_uri: null,
  spotted_at: "2026-10-05T10:00:00.000Z",
});

const defaultProps = {
  onLog: jest.fn(),
  onDelete: jest.fn(),
  onRefresh: jest.fn(),
  loading: false,
};

describe("HomeScreen", () => {
  it("renders the empty state and starts a new sighting", () => {
    const onLog = jest.fn();
    render(<HomeScreen {...defaultProps} sightings={[]} onLog={onLog} />);

    expect(screen.getByText("Nothing on the board. Yet.")).toBeTruthy();
    expect(screen.getByText("Your trainspotting story starts here")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Log your first sighting" }));
    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it("renders the summary, class count, and sightings", () => {
    render(
      <HomeScreen
        {...defaultProps}
        sightings={[makeSighting(1), makeSighting(2), makeSighting(3, "66")]}
      />,
    );

    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3 logged on this device")).toBeTruthy();
    expect(screen.getByText("37001")).toBeTruthy();
    expect(screen.getByText("66003")).toBeTruthy();
  });

  it("opens the logging screen from the summary action", () => {
    const onLog = jest.fn();
    render(<HomeScreen {...defaultProps} onLog={onLog} sightings={[]} />);

    fireEvent.press(screen.getByRole("button", { name: "Log a train sighting" }));

    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it("refreshes the sightings list", () => {
    const onRefresh = jest.fn();
    render(
      <HomeScreen {...defaultProps} onRefresh={onRefresh} sightings={[]} loading />,
    );

    fireEvent(screen.UNSAFE_getByType(RefreshControl), "refresh");

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("limits the home list to twenty and shows the overflow note", () => {
    render(
      <HomeScreen
        {...defaultProps}
        sightings={Array.from({ length: 21 }, (_, index) => makeSighting(index))}
      />,
    );

    expect(screen.getByText("Showing your 20 most recent sightings.")).toBeTruthy();
    expect(screen.getByText("37000")).toBeTruthy();
    expect(screen.queryByText("37020")).toBeNull();
  });

  it("does not show the overflow note for exactly twenty sightings", () => {
    render(
      <HomeScreen
        {...defaultProps}
        sightings={Array.from({ length: 20 }, (_, index) => makeSighting(index))}
      />,
    );

    expect(screen.queryByText("Showing your 20 most recent sightings.")).toBeNull();
  });
});
