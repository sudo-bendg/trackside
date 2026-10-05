import { fireEvent, render, screen } from "@testing-library/react-native";
import { BottomTabBar } from "./BottomTabBar";

describe("BottomTabBar", () => {
  it.each([
    ["home", "Home"],
    ["log", "Log"],
    ["profile", "Profile"],
  ] as const)("marks %s active and changes to each tab", (activeTab, label) => {
    const onTabChange = jest.fn();
    render(<BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs.find((tab) => tab.props.accessibilityState.selected)?.props.children)
      .toBeDefined();

    fireEvent.press(screen.getByText(label));
    expect(onTabChange).toHaveBeenCalledWith(activeTab);
  });

  it("switches from a selected tab to a different tab", () => {
    const onTabChange = jest.fn();
    render(<BottomTabBar activeTab="home" onTabChange={onTabChange} />);

    fireEvent.press(screen.getByText("Profile"));

    expect(onTabChange).toHaveBeenCalledWith("profile");
  });
});
