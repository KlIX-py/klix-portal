import { useState } from 'react'
import type { MediaAsset } from '../types'
import { outputDimensions } from '../utils/media'

const modes = [['FAST', 'Fast cleanup and sharpening.'], ['ENHANCE', 'Balanced local AI restoration.'], ['KLIX MAX', 'Slowest · highest quality.']] as const
const presets: Record<string, number[]> = { Natural: [30, 18, 0, 0], Clean: [48, 32, 6, 3], Crisp: [28, 64, 12, 4], Vivid: [20, 38, 18, 28] }
export function Controls({ asset, onEnhance }: { asset: MediaAsset | null; onEnhance(): void }) {
  const [mode, setMode] = useState('ENHANCE'); const [profile, setProfile] = useState('Real Life'); const [preset, setPreset] = useState('Natural'); const [output, setOutput] = useState('Original'); const [adjust, setAdjust] = useState(presets.Natural)
  const selectPreset = (name: string) => { setPreset(name); setAdjust(presets[name]) }
  const names = ['Cleanup', 'Sharpen', 'Contrast', 'Color']
  return <aside className="controls"><section className="panel-block"><p className="eyebrow">ENHANCEMENT MODE</p><div className="mode-stack">{modes.map(([name, description]) => <button key={name} className={`mode ${mode === name ? 'selected' : ''}`} onClick={() => setMode(name)}><b>{name}</b><small>{description}</small></button>)}</div></section>
    <section className="panel-block"><label>Content profile<select value={profile} onChange={event => setProfile(event.target.value)}>{['Real Life', 'Football', 'Anime', 'Gaming', 'Low Quality'].map(item => <option key={item}>{item}</option>)}</select></label><label>Look preset<select value={preset} onChange={event => selectPreset(event.target.value)}>{Object.keys(presets).map(item => <option key={item}>{item}</option>)}</select></label></section>
    <section className="panel-block adjustments">{names.map((name, index) => <label key={name}>{name}<output>{adjust[index]}</output><input aria-label={name} type="range" value={adjust[index]} onChange={event => setAdjust(current => current.map((value, at) => at === index ? Number(event.target.value) : value))} /></label>)}</section>
    <section className="panel-block"><label>Output resolution<select value={output} onChange={event => setOutput(event.target.value)}>{['Original', '1080p', '1440p', '4K'].map(item => <option key={item}>{item}</option>)}</select></label><p className="output-dim">{asset ? outputDimensions(asset.metadata.width, asset.metadata.height, output) : 'Import media to see output'}</p></section>
    <button className="enhance" onClick={onEnhance}>Enhance <span>→</span></button>
  </aside>
}
