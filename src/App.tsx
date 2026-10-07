import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Home from './pages/Home';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmProvider } from './context/ConfirmProvider';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { GlobalErrorHandler } from './components/errors/GlobalErrorHandler';

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
      {/* Last line of defence: without it, an error anywhere blanks the whole window. */}
      <ErrorBoundary name="Editor" variant="app">
      <GlobalErrorHandler />
      <NotificationProvider>
        <ConfirmProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
              </Route>
            </Routes>
          </HashRouter>
        </ConfirmProvider>
      </NotificationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
