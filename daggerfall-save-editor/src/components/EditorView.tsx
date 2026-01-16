import React from 'react';
import { useRecoilValue } from 'recoil';
import { saveDataState } from '../state';

export const EditorView: React.FC = () => {
    const saveData = useRecoilValue(saveDataState);

    if (!saveData) return null;

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
            <h2>Save Data Loaded</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', marginBottom: '20px' }}>
                <strong>Player Name:</strong> 
                <span>{saveData.playerData?.playerEntity?.name || 'N/A'}</span>
                
                <strong>Level:</strong>
                <span>{saveData.playerData?.playerEntity?.level || 'N/A'}</span>

                <strong>Gender:</strong>
                <span>{saveData.playerData?.playerEntity?.gender || 'N/A'}</span>
                
                <strong>Race:</strong>
                <span>{saveData.playerData?.playerEntity?.raceTemplate?.Name || 'N/A'}</span>
            </div>

            <h3>Raw Data Preview (First 50 lines)</h3>
            <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '4px', overflowX: 'auto' }}>
                {JSON.stringify(saveData, null, 4)}
            </pre>
        </div>
    );
};
