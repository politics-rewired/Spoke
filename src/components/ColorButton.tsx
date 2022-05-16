import type { ButtonProps } from "@material-ui/core/Button";
import Button from "@material-ui/core/Button";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import React from "react";

export type ColorButtonProps = {
  backgroundColor: string;
} & Omit<ButtonProps, "color">;

export const ColorButton: React.FC<ColorButtonProps> = (props) => {
  const { backgroundColor, children, ...rest } = props;
  const theme = createTheme({
    palette: {
      primary: { main: backgroundColor }
    }
  });
  return (
    <ThemeProvider theme={theme}>
      <Button {...rest} color="primary">
        {children}
      </Button>
    </ThemeProvider>
  );
};

export default ColorButton;
