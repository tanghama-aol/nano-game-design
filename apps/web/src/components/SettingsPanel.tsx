import { useEffect, useState } from 'react';
import axios from 'axios';
import type { ApiProvider, ISettings, IUpdateSettings } from '@nano-game/types';
import { KeyRound, Save } from 'lucide-react';
import { useI18n } from '../i18n';

const PROVIDERS: { value: ApiProvider; label: string }[] = [
  { value: 'GEMINI', label: 'Gemini' },
  { value: 'VERTEX', label: 'Vertex AI' },
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'OPENAI_COMPATIBLE', label: 'OpenAI-compatible' },
  { value: 'SIMULATED', label: 'Simulation' },
];

export function SettingsPanel() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [formData, setFormData] = useState<Partial<IUpdateSettings>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // On load, the API returns redacted credential flags plus editable non-secret
    // fields. Password inputs stay blank so saved secrets are never echoed.
    axios.get('http://localhost:3001/api/settings')
      .then((res) => {
        setSettings(res.data);
        setFormData({
          authMode: res.data.authMode,
          textProvider: res.data.textProvider,
          imageProvider: res.data.imageProvider,
          textModel: res.data.textModel,
          imageModel: res.data.imageModel,
          textBaseUrl: res.data.textBaseUrl,
          imageBaseUrl: res.data.imageBaseUrl,
          maxConcurrency: res.data.maxConcurrency,
          globalSeed: res.data.globalSeed,
        });
      })
      .catch(() => {
        setMessage(t('backendUnavailableSettings'));
      });
  }, [t]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      // Only values present in formData are sent. The backend decides which
      // fields should overwrite, preserve, clear, or encrypt.
      await axios.post('http://localhost:3001/api/settings', formData);
      setMessage(t('settingsSaved'));
    } catch {
      setMessage(t('settingsFailed'));
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
            {t('apiSettings')}
          </h2>
        </div>
        <div className="mt-4 rounded-md border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
          {message || t('loadingSettings')}
        </div>
      </section>
    );
  }

  const hasCredential = settings.hasTextCredential && settings.hasImageCredential;
  // Provider-specific booleans keep the JSX readable and make it obvious which
  // credential forms appear for each SDK/auth style.
  const textProvider = formData.textProvider || 'GEMINI';
  const imageProvider = formData.imageProvider || 'GEMINI';
  const usesGemini = textProvider === 'GEMINI' || imageProvider === 'GEMINI';
  const usesVertex = textProvider === 'VERTEX' || imageProvider === 'VERTEX';

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <KeyRound size={17} className="text-cyan-300" />
          {t('apiSettings')}
        </h2>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${hasCredential ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}>
          {hasCredential ? t('credentialSaved') : t('credentialNeeded')}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProviderSelect
          label={t('textProvider')}
          value={textProvider}
          onChange={(value) => setFormData({ ...formData, textProvider: value, authMode: value })}
        />
        <ProviderSelect
          label={t('imageProvider')}
          value={imageProvider}
          onChange={(value) => setFormData({ ...formData, imageProvider: value })}
        />
      </div>

      {usesGemini && (
        <div className="mt-4">
          <label className="field-label">{t('geminiApiKey')}</label>
          <input
            type="password"
            placeholder={settings.hasGeminiKey ? t('credentialSaved') : 'GEMINI_API_KEY'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
          />
        </div>
      )}

      {usesVertex && (
        <div className="mt-4 space-y-2">
          <label className="field-label">{t('vertexCredentials')}</label>
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
            placeholder={settings.hasVertexPrivateKey ? t('credentialSaved') : 'Private Key'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, vertexPrivateKey: e.target.value })}
          />
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">{t('textBaseUrl')}</label>
          <input
            type="text"
            value={formData.textBaseUrl || ''}
            placeholder="https://api.openai.com/v1"
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, textBaseUrl: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">{t('imageBaseUrl')}</label>
          <input
            type="text"
            value={formData.imageBaseUrl || ''}
            placeholder="https://api.openai.com/v1"
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, imageBaseUrl: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">{t('textApiKey')}</label>
          <input
            type="password"
            placeholder={settings.hasTextCredential ? t('credentialSaved') : 'OPENAI_API_KEY / TEXT_API_KEY'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, textApiKey: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">{t('imageApiKey')}</label>
          <input
            type="password"
            placeholder={settings.hasImageCredential ? t('credentialSaved') : 'OPENAI_API_KEY / IMAGE_API_KEY'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, imageApiKey: e.target.value })}
          />
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-slate-500">{t('envCodexHint')}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">{t('textModel')}</label>
          <input
            type="text"
            value={formData.textModel || ''}
            placeholder={textProvider === 'OPENAI' ? 'gpt-5.5' : 'gemini-1.5-pro'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, textModel: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">{t('imageModel')}</label>
          <input
            type="text"
            value={formData.imageModel || ''}
            placeholder={imageProvider === 'OPENAI' ? 'image2' : 'imagen-3.0-generate-001'}
            className="field-input p-2 text-sm"
            onChange={(e) => setFormData({ ...formData, imageModel: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="field-label">{t('maxConcurrency')}</label>
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
        <div className="mt-3 rounded-md border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {message}
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="secondary-button mt-4 w-full">
        <Save size={16} />
        {saving ? `${t('save')}...` : t('save')}
      </button>
    </section>
  );
}

function ProviderSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ApiProvider;
  onChange: (value: ApiProvider) => void;
}) {
  // Controlled select: React owns the value, and changes are lifted to the
  // SettingsPanel form state instead of reading DOM state on submit.
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="field-input p-2 text-sm" value={value} onChange={(event) => onChange(event.target.value as ApiProvider)}>
        {PROVIDERS.map((provider) => (
          <option key={provider.value} value={provider.value}>
            {provider.label}
          </option>
        ))}
      </select>
    </div>
  );
}
