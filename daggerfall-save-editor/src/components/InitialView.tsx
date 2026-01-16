import React from 'react';

export const InitialView: React.FC = () => {
    return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', borderRadius: '8px', color: '#888' }}>
          <p>Please use <strong>File &gt; Open</strong> to load a SaveData.txt</p>
        </div>
    );
};
