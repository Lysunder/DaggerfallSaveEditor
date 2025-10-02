import React from "react";
import { createRoot } from "react-dom/client";
import Button from "@mui/material/Button";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import CharacterTabs from "./components/characterTabs.component";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const root = createRoot(document.body);
root.render(
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <CharacterTabs />
  </ThemeProvider>
);
