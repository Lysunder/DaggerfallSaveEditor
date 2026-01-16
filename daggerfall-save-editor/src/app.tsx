import { useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { saveDataState, filePathState } from './state'
import { InitialView } from './components/InitialView'
import { EditorView } from './components/EditorView'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [saveData, setSaveData] = useRecoilState(saveDataState);
  const [filePath, setFilePath] = useRecoilState(filePathState);

  useEffect(() => {
    // Listen for file opened
    // @ts-ignore
    window.ipcRenderer.onOpen(({ path, content }) => {
      try {
        const json = JSON.parse(content);
        setSaveData(json);
        setFilePath(path);
      } catch (e) {
        console.error('Failed to parse JSON', e);
        alert('Failed to parse JSON file');
      }
    });

    // Listen for save request
    // @ts-ignore
    window.ipcRenderer.onSaveRequest(() => {
       if (saveData) {
         const content = JSON.stringify(saveData, null, 4);
         // @ts-ignore
         window.ipcRenderer.saveContent(filePath, content);
       } else {
         alert('No data to save!');
       }
    });
    
    // Listen for save confirmation
    // @ts-ignore
    window.ipcRenderer.onSaved(({ path }) => {
        setFilePath(path);
        alert('File saved successfully!');
    });

  }, [saveData, filePath, setSaveData, setFilePath]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ 
        padding: '20px', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Daggerfall Save Editor
        </Typography>
        {filePath && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Editing: {filePath}
          </Typography>
        )}
        
        {!saveData ? <InitialView /> : <EditorView />}
      </Box>
    </ThemeProvider>
  )
}

export default App
