const SHORTCUTS = [
  { keys: ['Space'],        label: 'Play / pause' },
  { keys: ['←', '→'],      label: 'Seek ±5s' },
  { keys: ['⇧', '←', '→'], label: 'Seek ±1s' },
  { keys: ['↑', '↓'],      label: 'Volume' },
  { keys: ['M'],            label: 'Mute' },
  { keys: ['L'],            label: 'Loop' },
  { keys: ['F'],            label: 'Fullscreen' },
];

export default function ShortcutsLegend() {
  return (
    <div className="shortcuts-legend">
      {SHORTCUTS.map(({ keys, label }) => (
        <div className="shortcut-item" key={label}>
          {keys.map((k) => (
            <kbd className="shortcut-key" key={k}>{k}</kbd>
          ))}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
