import { fireEvent, render, screen } from "@testing-library/react-native";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("renders the accessible icon and invokes its callback", () => {
    const onPress = jest.fn();
    render(
      <IconButton
        name="close"
        accessibilityLabel="Close dialog"
        onPress={onPress}
        color="#123456"
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Close dialog" }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("close")).toBeTruthy();
  });

  it("uses its default icon color", () => {
    const button = IconButton({
      name: "close",
      accessibilityLabel: "Close",
      onPress: jest.fn(),
    });

    expect(button.props.children.props.color).toBe("#28583F");
  });
});
