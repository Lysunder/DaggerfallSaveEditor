// import React, { useEffect } from 'react'
import { useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { saveDataState, filePathState } from './state'
import { InitialView } from './components/InitialView'
import { EditorView } from './components/EditorView'

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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h2>Daggerfall Save Editor</h2>
      {filePath && <p style={{ color: '#666', fontSize: '0.9em' }}>Editing: {filePath}</p>}
      
      {!saveData ? <InitialView /> : <EditorView />}
    </div>
  )
}

export default App
