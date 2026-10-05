import { styles } from "./styles";
import { getPressableStyle } from "./pressableStyle";

describe("getPressableStyle", () => {
  it("keeps the base style and omits pressed feedback while idle", () => {
    expect(getPressableStyle(styles.primaryButton, false)).toEqual([
      styles.primaryButton,
      false,
    ]);
  });

  it("adds pressed feedback while a control is pressed", () => {
    expect(getPressableStyle(styles.primaryButton, true)).toEqual([
      styles.primaryButton,
      styles.pressed,
    ]);
  });
});
