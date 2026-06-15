import { useEffect, useState } from 'react';
import axios from 'axios';
import type { ISettings, IUpdateSettings } from '@nano-game/types';
import { KeyRound, Save } from 'lucide-react';

export function SettingsPanel() {
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [formData, setFormData] = useState<Partial<IUpdateSettings>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/api/settings')
      .then((res) => {
        setSettings(res.data);
        setFormData({
          authMode: res.data.authMode,
          textModel: res.data.textModel,
          imageModel: res.data.imageModel,
          maxConcurrency: res.data.maxConcurrency,
          globalSeed: res.data.globalSeed,
        });
      })
      .catch(() => {
        setMessage('Backend unavailable. Start the API server to edit credentials.');
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.post('http://localhost:3001/api/settings', formData);
      setMessage('Settings saved.');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <section className="panel p-4">
        <div className="panel-header">
          <h2 className="panel-title">
            <KeyRound size={17} className="text-cyan-300" />
            API Settings
          </h2>
        </div>
        <div className="mt-4 rounded-md border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
          {message || 'Loading settings...'}
        </div>
      </section>
    );
  }

  const hasCredential = settings.hasGeminiKey || settings.hasVertexPrivateKey;

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <KeyRound size={17} className="text-cyan-300" />
          API Settings
        </h2>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${hasCredential ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}>
          {hasCredential ? 'Credential saved' : 'Credential needed'}
        </span>
      </div>

      <div className="mb-4">
        <label className="field-label">Auth Mode</label>
        <select
          className="field-input p-2 text-sm"
          value={formData.authMode || 'GEMINI'}
          onChange={(e) => setFormData({ ...formData, authMode: e.target.value as IUpdateSettings['authMode'] })}
        >
          <option value="GEMINI">Gemini API Key</option>
          <option value="VERTEX">Vertex AI Service Account</option>
        </select>
      </div>

      {formData.authMode === 'GEMINI' ? (
        <div className="mb-4">
          <label className="field-label">Gemini API Key</label>
          <input
            type="password"
            placeholder={settings.hasGeminiKey ? 'Saved key is encrypted locally' : 'Enter API key'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
          />
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          <label className="field-label">Vertex Credentials</label>
          <input
            type="text"
            placeholder={settings.vertexProjectId || 'Project ID'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, vertexProjectId: e.target.value })}
          />
          <input
            type="text"
            placeholder={settings.vertexClientEmail || 'Client Email'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, vertexClientEmail: e.target.value })}
          />
          <input
            type="password"
            placeholder={settings.hasVertexPrivateKey ? 'Saved private key is encrypted locally' : 'Private Key'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, vertexPrivateKey: e.target.value })}
          />
        </div>
      )}

      <div className="mb-4">
        <label className="field-label">Text Model</label>
        <input
          type="text"
          value={formData.textModel || ''}
          className="field-input p-2 text-sm"
          onChange={(e) => setFormData({ ...formData, textModel: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className="field-label">Image Model</label>
        <input
          type="text"
          value={formData.imageModel || ''}
          className="field-input p-2 text-sm"
          onChange={(e) => setFormData({ ...formData, imageModel: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className="field-label">Max Concurrency</label>
        <input
          type="number"
          value={formData.maxConcurrency || 3}
          min={1}
          max={10}
          className="field-input p-2 text-sm"
          onChange={(e) => setFormData({ ...formData, maxConcurrency: parseInt(e.target.value) })}
        />
      </div>

      {message && (
        <div className="mb-3 rounded-md border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {message}
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="secondary-button w-full">
        <Save size={16} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </section>
  );
}
