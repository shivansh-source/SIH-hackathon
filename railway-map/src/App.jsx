import React, { useState, useMemo, useRef } from 'react';

// --- Data for the railway yard layout ---
const yardData = {
  tracks: [ { id: 'T_W_UP_IN', d: 'M 50 500 L 250 500' }, { id: 'T_W_DOWN_OUT', d: 'M 50 550 L 250 550' }, { id: 'T_N_IN', d: 'M 500 50 L 300 450' }, { id: 'T_E_UP_OUT', d: 'M 1350 500 L 1550 500' }, { id: 'T_E_DOWN_IN', d: 'M 1350 550 L 1550 550' }, { id: 'ML_UP', d: 'M 250 500 L 1350 500' }, { id: 'ML_DOWN', d: 'M 250 550 L 1350 550' }, { id: 'PASS_LINE', d: 'M 400 100 L 1200 100' }, { id: 'GOODS_LINE', d: 'M 400 450 L 1200 450' }, { id: 'PL1', d: 'M 400 175 L 1200 175' }, { id: 'PL2', d: 'M 400 250 L 1200 250' }, { id: 'PL3', d: 'M 400 325 L 1200 325' }, { id: 'PL4', d: 'M 400 400 L 1200 400' }, { id: 'PL5', d: 'M 400 625 L 1200 625' }, { id: 'PL6', d: 'M 400 700 L 1200 700' }, { id: 'SALOON_SID', d: 'M 200 700 L 350 700' }, { id: 'WASH_1', d: 'M 1250 50 L 1500 50' }, { id: 'STAB_1', d: 'M 1250 175 L 1500 175' }, ],
  platforms: [ { id: 'PLAT_PASS', x: 400, y: 70, width: 800, height: 25 }, { id: 'PLAT_1', x: 400, y: 187.5, width: 800, height: 25 }, { id: 'PLAT_2_3', x: 400, y: 262.5, width: 800, height: 50 }, { id: 'PLAT_4', x: 400, y: 405, width: 800, height: 20 }, { id: 'PLAT_5_6', x: 400, y: 637.5, width: 800, height: 50 }, ],
  points: [ { id: 'P_N_MERGE_UP', d: 'M 300 450 L 250 500' }, { id: 'P_W_UP_PASS', d: 'M 325 500 L 400 100' }, { id: 'P_W_UP_PL1', d: 'M 350 500 L 400 175' }, { id: 'P_W_UP_PL2', d: 'M 375 500 L 400 250' }, { id: 'P_W_UP_PL3', d: 'M 400 500 L 400 325' }, { id: 'P_W_UP_PL4', d: 'M 425 500 L 400 400' }, { id: 'P_W_UP_GOODS', d: 'M 450 500 L 400 450' }, { id: 'P_W_DOWN_GOODS', d: 'M 400 525 L 375 550' }, { id: 'P_W_PL5_DOWN', d: 'M 400 625 L 375 550' }, { id: 'P_W_PL6_DOWN', d: 'M 400 700 L 400 550' }, { id: 'P_W_SALOON', d: 'M 350 700 L 300 550' }, { id: 'P_E_PASS_UP', d: 'M 1200 100 L 1225 500' }, { id: 'P_E_PL1_UP', d: 'M 1200 175 L 1250 500' }, { id: 'P_E_PL2_UP', d: 'M 1200 250 L 1275 500' }, { id: 'P_E_PL3_UP', d: 'M 1200 325 L 1300 500' }, { id: 'P_E_PL4_UP', d: 'M 1200 400 L 1325 500' }, { id: 'P_E_GOODS_UP', d: 'M 1200 450 L 1225 500' }, { id: 'P_E_DOWN_GOODS', d: 'M 1200 525 L 1225 550' }, { id: 'P_E_DOWN_PL5', d: 'M 1200 625 L 1250 550' }, { id: 'P_E_DOWN_PL6', d: 'M 1200 700 L 1275 550' }, { id: 'P_E_YARD_LEAD_IN', d: 'M 1200 175 L 1250 100' }, { id: 'P_E_WASH_1', d: 'M 1250 100 L 1250 50' }, { id: 'P_E_STAB_1', d: 'M 1200 175 L 1250 175' }, ],
  signals: [ { id: 'S_W_IN', x: 240, y: 500, state: 'green' }, { id: 'S_W_OUT', x: 260, y: 550, state: 'red' }, { id: 'S_E_IN', x: 1360, y: 550, state: 'green' }, { id: 'S_E_OUT', x: 1340, y: 500, state: 'red' }, { id: 'S_N_IN', x: 490, y: 50, state: 'green' }, ],
  labels: [ { x: 800, y: 40, text: 'BANARAS (BSBS)', size: '24px', weight: 'bold', fill: '#e5e7eb' }, { x: 100, y: 470, text: 'To PRAYAGRAJ', size: '14px', fill: '#9ca3af' }, { x: 1400, y: 470, text: 'To VARANASI JN.', size: '14px', fill: '#9ca3af' }, { x: 400, y: 30, text: 'To HARDATTPUR', size: '14px', fill: '#9ca3af' }, { x: 425, y: 88, text: 'PASS', fill: '#d1d5db' }, { x: 425, y: 195, text: '1', fill: '#d1d5db' }, { x: 425, y: 270, text: '2', fill: '#d1d5db' }, { x: 425, y: 318, text: '3', fill: '#d1d5db' }, { x: 425, y: 420, text: '4', fill: '#d1d5db' }, { x: 425, y: 645, text: '5', fill: '#d1d5db' }, { x: 425, y: 692, text: '6', fill: '#d1d5db' }, { x: 275, y: 685, text: 'SALOON', fill: '#d1d5db' }, { x: 450, y: 480, text: 'GOODS', size: '12px', fill: '#d1d5db' }, { x: 1400, y: 30, text: 'WASHING YARD', size: '14px', fill: '#9ca3af' }, ]
};

// --- Child components for rendering SVG elements ---
const Track = ({ d, isRoute }) => <path d={d} stroke={isRoute ? '#22c55e' : '#6b7280'} strokeWidth="5" fill="none" />;
const Point = ({ d, isRoute }) => <path d={d} stroke={isRoute ? '#22c55e' : '#6b7280'} strokeWidth="5" strokeDasharray="5,5" fill="none" />;
const Signal = ({ x, y, state }) => <circle cx={x} cy={y} r="8" fill={state === 'green' ? '#22c55e' : '#ef4444'} stroke="#1f2937" strokeWidth="2" />;
const Platform = ({ x, y, width, height }) => <rect x={x} y={y} width={width} height={height} fill="#52525b" stroke="#a1a1aa" strokeWidth="1" />;
const StationLabel = ({ x, y, text, size, weight, fill }) => <text x={x} y={y} fill={fill || "#e5e7eb"} fontSize={size || '16px'} fontWeight={weight || 'normal'} textAnchor="middle">{text}</text>;
const Train = ({ x, y, id }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="-30" y="-10" width="60" height="20" rx="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
    <text x="0" y="5" fill="#fff" textAnchor="middle" fontSize="12" fontWeight="bold">{id}</text>
  </g>
);


export default function App() {
  const [trains, setTrains] = useState([
    { id: 'VndBhrat', x: 150, y: 500, currentRoute: 0, routes: [['T_W_UP_IN', 'P_W_UP_PL3', 'PL3', 'P_E_PL3_UP', 'T_E_UP_OUT']] },
    { id: 'ShivGanga', x: 1450, y: 550, currentRoute: 0, routes: [['T_E_DOWN_IN', 'ML_DOWN', 'T_W_DOWN_OUT']] },
  ]);
  const [selectedTrainId, setSelectedTrainId] = useState(trains[0].id);

  const selectedTrain = useMemo(() => trains.find(t => t.id === selectedTrainId), [trains, selectedTrainId]);
  const selectedRoute = useMemo(() => new Set(selectedTrain?.routes[selectedTrain.currentRoute] || []), [selectedTrain]);

  const handleTrainSelection = (trainId) => setSelectedTrainId(trainId);

  return (
    <div className="app-container">
      
      <div className="map-container">
        <svg viewBox="0 0 1600 900" className="svg-map">
          {yardData.tracks.map(track => <Track key={track.id} d={track.d} isRoute={selectedRoute.has(track.id)} />)}
          {yardData.points.map(point => <Point key={point.id} d={point.d} isRoute={selectedRoute.has(point.id)} />)}
          {yardData.platforms.map(platform => <Platform key={platform.id} {...platform} />)}
          {yardData.labels.map(label => <StationLabel key={label.text} {...label} />)}
          {trains.map(train => <Train key={train.id} {...train} />)}
          {yardData.signals.map(signal => <Signal key={signal.id} {...signal} />)}        
        </svg>
      </div>

      <div className="control-panel">
        <h2 className="panel-title">System Control Panel</h2>
        <div className="panel-grid">
          <div>
            <h3 className="panel-subtitle">Select Train:</h3>
            <div className="button-group">
              {trains.map(train => (
                <button 
                  key={train.id} 
                  onClick={() => handleTrainSelection(train.id)}
                  className={selectedTrainId === train.id ? 'btn btn-selected' : 'btn'}
                >
                  {train.id}
                </button>
              ))}
            </div>
          </div>
          {selectedTrain && (
            <div>
              <h3 className="panel-subtitle">Route for {selectedTrain.id}:</h3>
              <p className="route-display">
                {selectedTrain.routes[selectedTrain.currentRoute].join(' -> ')}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}