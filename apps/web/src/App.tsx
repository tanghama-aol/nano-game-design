import { SettingsPanel } from './components/SettingsPanel'
import { ConceptInput } from './components/ConceptInput'
import { ResourceTree } from './components/ResourceTree'
import { PromptPanel } from './components/PromptPanel'
import { SeedLibrary } from "./components/SeedLibrary";
import { GenerationPanel } from './components/GenerationPanel'
import { EditorPanel } from './components/EditorPanel'
import { ReskinPanel } from './components/ReskinPanel'
import { useTreeStore } from './store/treeStore'
import type { IResourceNode, NodeStatus } from '@nano-game/types'
import type { ReactNode } from 'react'
import { Boxes, CheckCircle2, CircleDashed, ImageIcon, Languages, Loader2, Sparkles, TriangleAlert } from 'lucide-react'
import { useI18n } from './i18n'

function flattenNodes(nodes: IResourceNode[]): IResourceNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenNodes(node.children) : [])])
}

function App() {
  const { language, setLanguage, t } = useI18n()
  const nodes = useTreeStore((state) => state.nodes)
  const globalStyle = useTreeStore((state) => state.globalStyle)
  const flatNodes = flattenNodes(nodes)
  const statusCounts = flatNodes.reduce<Record<NodeStatus, number>>(
    (acc, node) => {
      acc[node.status] += 1
      return acc
    },
    { pending: 0, generating: 0, success: 0, failed: 0 },
  )
  const completionRate = flatNodes.length > 0 ? Math.round((statusCounts.success / flatNodes.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-20%] top-[-20%] h-[42rem] w-[42rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-18%] top-[18%] h-[36rem] w-[36rem] rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <main className="relative mx-auto flex max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-slate-700/70 bg-slate-950/80 px-5 py-4 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                <Sparkles size={15} />
                {t('appKicker')}
              </div>
              <h1 className="text-3xl font-black tracking-normal text-white sm:text-4xl">
                {t('appTitle')}
              </h1>
              <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-300">
                {t('appSubtitle')}
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-5 xl:min-w-[46rem]">
              <Metric icon={<Boxes size={18} />} label={t('assets')} value={flatNodes.length} tone="cyan" />
              <Metric icon={<CircleDashed size={18} />} label={t('pending')} value={statusCounts.pending} tone="slate" />
              <Metric icon={<Loader2 size={18} />} label={t('running')} value={statusCounts.generating} tone="blue" />
              <Metric icon={<CheckCircle2 size={18} />} label={t('ready')} value={statusCounts.success} tone="green" />
              <Metric icon={<TriangleAlert size={18} />} label={t('failed')} value={statusCounts.failed} tone="red" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 md:grid-cols-[1fr_16rem_10rem]">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>{t('exportReadiness')}</span>
                <span>{completionRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
              <ImageIcon className="text-amber-300" size={20} />
              <div className="min-w-0">
                <div className="text-xs text-slate-500">{t('globalStyle')}</div>
                <div className="truncate text-sm font-semibold text-slate-100">{globalStyle}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
              <Languages className="text-cyan-300" size={20} />
              <select
                className="field-input border-0 bg-transparent p-0 text-sm font-bold"
                value={language}
                aria-label={t('language')}
                onChange={(event) => setLanguage(event.target.value as 'en' | 'zh')}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start">
          <div className="flex flex-col gap-5 xl:col-span-3">
            <ConceptInput />
            <ReskinPanel />
            <PromptPanel />
            <SeedLibrary />
            <SettingsPanel />
          </div>

          <div className="flex flex-col gap-5 xl:col-span-5">
            <GenerationPanel />
            <ResourceTree />
          </div>

          <div className="xl:col-span-4">
            <EditorPanel />
          </div>
        </div>
      </main>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: number
  tone: 'cyan' | 'slate' | 'blue' | 'green' | 'red'
}) {
  const tones = {
    cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
    slate: 'border-slate-500/30 bg-slate-700/20 text-slate-200',
    blue: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
    green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    red: 'border-red-400/30 bg-red-400/10 text-red-200',
  }

  return (
    <div className={`rounded-md border px-3 py-2 ${tones[tone]}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-black leading-none">{value}</div>
    </div>
  )
}

export default App
