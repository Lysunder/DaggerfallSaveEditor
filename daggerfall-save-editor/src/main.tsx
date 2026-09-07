import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Setup IPC listener for messages from main process
window.ipcRenderer?.on('main-process-message', (_event, message) => {
  console.log('Message from main process:', message);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
