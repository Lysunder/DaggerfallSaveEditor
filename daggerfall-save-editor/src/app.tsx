import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Home from './pages/Home';
import Inventory from './pages/Inventory';

import GlobalVars from './pages/GlobalVars';
import { NotificationProvider } from './context/NotificationContext';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <NotificationProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="inventory" element={<Inventory />} />

              <Route path="globals" element={<GlobalVars />} />
            </Route>
          </Routes>
        </HashRouter>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
