import { render, screen, waitFor } from "@testing-library/react-native";
import App from "./App";
import { getSightings } from "./src/database";
import { useSQLiteContext } from "expo-sqlite";

jest.mock("./src/database", () => ({
  deleteSighting: jest.fn(),
  getSightings: jest.fn(),
  initializeDatabase: jest.fn(),
  saveSighting: jest.fn(),
}));

const mockGetSightings = jest.mocked(getSightings);
const mockUseSQLiteContext = jest.mocked(useSQLiteContext);

describe("App entry point", () => {
  const originalIntegrationFlag = process.env.EXPO_PUBLIC_SQLITE_INTEGRATION;

  beforeEach(() => {
    mockUseSQLiteContext.mockReturnValue({} as ReturnType<typeof useSQLiteContext>);
    mockGetSightings.mockResolvedValue([]);
  });

  afterEach(() => {
    if (originalIntegrationFlag === undefined) {
      delete process.env.EXPO_PUBLIC_SQLITE_INTEGRATION;
    } else {
      process.env.EXPO_PUBLIC_SQLITE_INTEGRATION = originalIntegrationFlag;
    }
  });

  it("renders the native SQLite integration harness when enabled", () => {
    process.env.EXPO_PUBLIC_SQLITE_INTEGRATION = "1";

    render(<App />);

    expect(screen.getByText("Native SQLite integration")).toBeTruthy();
  });

  it("renders the normal app and initializes its database provider by default", async () => {
    delete process.env.EXPO_PUBLIC_SQLITE_INTEGRATION;

    render(<App />);

    await waitFor(() => expect(screen.getByText("Recent sightings")).toBeTruthy());
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });
});
