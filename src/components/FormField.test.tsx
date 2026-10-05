import { fireEvent, render, screen } from "@testing-library/react-native";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("renders its label, hint, placeholder, and forwards input changes and props", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <FormField
        label="TOPS number"
        hint="4–6 digits"
        value=""
        onChangeText={onChangeText}
        placeholder="Enter number"
        accessibilityLabel="Train number input"
        keyboardType="number-pad"
      />,
    );

    expect(screen.getByText("TOPS number")).toBeTruthy();
    expect(screen.getByText("4–6 digits")).toBeTruthy();
    const input = getByPlaceholderText("Enter number");
    expect(input.props.accessibilityLabel).toBe("Train number input");
    expect(input.props.keyboardType).toBe("number-pad");

    fireEvent.changeText(input, "37025");
    expect(onChangeText).toHaveBeenCalledWith("37025");
  });

  it("omits the optional hint when it is not supplied", () => {
    render(
      <FormField
        label="Location"
        value=""
        onChangeText={jest.fn()}
        placeholder="Station"
      />,
    );

    expect(screen.getByText("Location")).toBeTruthy();
    expect(screen.queryByText("OPTIONAL")).toBeNull();
  });
});
