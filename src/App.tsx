import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Plus, 
  Minus, 
  Table as TableIcon, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert,
  Loader2,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
  History,
  Save,
  LogOut,
  Search,
  FileText,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { analyzeDecision, DecisionAnalysis } from './lib/gemini';

const generateMarkdown = (analysis: DecisionAnalysis, prompt: string) => {
  let md = `# Decision Analysis: ${prompt}\n\n`;
  md += `## Summary\n${analysis.summary}\n\n`;
  md += `## Recommendation\n**${analysis.recommendation}**\n\n`;
  
  md += `## Pros & Cons\n`;
  md += `### Pros\n${analysis.pros.map(p => `- ${p}`).join('\n')}\n\n`;
  md += `### Cons\n${analysis.cons.map(c => `- ${c}`).join('\n')}\n\n`;
  
  md += `## SWOT Analysis\n`;
  md += `### Strengths\n${analysis.swot.strengths.map(s => `- ${s}`).join('\n')}\n\n`;
  md += `### Weaknesses\n${analysis.swot.weaknesses.map(w => `- ${w}`).join('\n')}\n\n`;
  md += `### Opportunities\n${analysis.swot.opportunities.map(o => `- ${o}`).join('\n')}\n\n`;
  md += `### Threats\n${analysis.swot.threats.map(t => `- ${t}`).join('\n')}\n\n`;
  
  if (analysis.comparison) {
    md += `## Comparison Table\n\n`;
    md += `| ${analysis.comparison.headers.join(' | ')} |\n`;
    md += `| ${analysis.comparison.headers.map(() => '---').join(' | ')} |\n`;
    analysis.comparison.rows.forEach(row => {
      md += `| ${row.join(' | ')} |\n`;
    });
  }
  
  return md;
};

const RecipeCard = ({ title, icon: Icon, children, delay = 0 }: { title: string, icon: any, children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 backdrop-blur-sm"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-[var(--bg-secondary)] rounded-lg">
        <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="font-display text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h3>
    </div>
    {children}
  </motion.div>
);

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'history'>('home');
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'proscons' | 'comparison' | 'swot'>('proscons');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (view === 'history') {
      fetchHistory();
    }
  }, [view]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/decisions/list');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const content = generateMarkdown(analysis, input);
      const filename = `Decision_${new Date().toISOString().split('T')[0]}_${input.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.md`;
      
      const res = await fetch('/api/decisions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content })
      });
      
      if (res.ok) {
        alert('Saved to History!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setError('Failed to save to history');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeDecision(input);
      setAnalysis(result);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setInput('');
    setError(null);
    setView('home');
  };

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-emerald-500/30 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            <span className="font-display font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">The Tiebreaker</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all hover:scale-110"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setView(view === 'home' ? 'history' : 'home')}
              className={`text-sm font-medium flex items-center gap-2 transition-colors ${view === 'history' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              <History className="w-4 h-4" />
              {view === 'history' ? 'Back to App' : 'History'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {view === 'history' ? (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100">Decision History</h1>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input 
                    type="text"
                    placeholder="Search past decisions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[var(--bg-secondary)] dark:bg-zinc-900 border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-2 text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none transition-all w-full md:w-64"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-zinc-500 dark:text-zinc-400">Loading your decisions...</p>
                </div>
              ) : filteredHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredHistory.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-[var(--bg-secondary)] rounded-xl text-emerald-600 dark:text-emerald-400">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{item.name.replace('.md', '').replace(/_/g, ' ')}</h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(item.createdTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          const res = await fetch(`/api/decisions/file/${item.id}`);
                          const text = await res.text();
                          const blob = new Blob([text], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = item.name;
                          a.click();
                        }}
                        className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-500 dark:text-zinc-400">No decisions found matching your search.</p>
                </div>
              )}
            </motion.div>
          ) : !analysis ? (
            <motion.div
              key="input-section"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-display font-bold tracking-tighter leading-none text-zinc-900 dark:text-zinc-100"
                >
                  Decide with <span className="text-emerald-500">Confidence.</span>
                </motion.h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto">
                  Stuck between choices? Let AI break the tie with deep analysis, SWOT, and comparison tables.
                </p>
              </div>

              <form onSubmit={handleAnalyze} className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Should I quit my job to start a bakery? / Which laptop should I buy: MacBook Pro or Dell XPS?"
                  className="w-full h-48 bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-3xl p-8 text-xl text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none transition-all resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                />
                <button
                  disabled={loading || !input.trim()}
                  className="absolute bottom-6 right-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-zinc-950 font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
                {[
                  { id: 'proscons', icon: Scale, label: "Pros & Cons" },
                  { id: 'comparison', icon: TableIcon, label: "Comparison Tables" },
                  { id: 'swot', icon: Zap, label: "SWOT Analysis" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAnalysisMode(item.id as any)}
                    className={`flex flex-col items-center gap-2 p-6 rounded-2xl border transition-all ${
                      analysisMode === item.id 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/50 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${analysisMode === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm font-medium"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Start New Analysis
                </button>
              </div>

              {/* Summary & Recommendation */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-display font-bold text-xl">The Verdict</span>
                </div>
                <p className="text-zinc-800 dark:text-zinc-100 text-lg leading-relaxed">
                  {analysis.summary}
                </p>
                <div className="pt-4 border-t border-emerald-500/10">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs">Recommendation</span>
                  <p className="text-2xl font-display font-bold text-zinc-900 dark:text-white mt-1">
                    {analysis.recommendation}
                  </p>
                </div>
              </div>

              {/* View Selector */}
              <div className="flex p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full md:w-fit mx-auto">
                {[
                  { id: 'proscons', label: 'Pros & Cons', icon: Scale },
                  { id: 'comparison', label: 'Comparison', icon: TableIcon },
                  { id: 'swot', label: 'SWOT', icon: Zap },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAnalysisMode(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      analysisMode === tab.id
                        ? 'bg-emerald-500 text-zinc-950 shadow-lg'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {analysisMode === 'proscons' && (
                  <motion.div
                    key="proscons"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* Pros */}
                    <RecipeCard title="Pros" icon={Plus}>
                      <ul className="space-y-3">
                        {analysis.pros.map((pro, i) => (
                          <li key={i} className="flex gap-3 text-zinc-600 dark:text-zinc-300">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </RecipeCard>

                    {/* Cons */}
                    <RecipeCard title="Cons" icon={Minus}>
                      <ul className="space-y-3">
                        {analysis.cons.map((con, i) => (
                          <li key={i} className="flex gap-3 text-zinc-600 dark:text-zinc-300">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </RecipeCard>
                  </motion.div>
                )}

                {analysisMode === 'swot' && (
                  <motion.div
                    key="swot"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <RecipeCard title="Strengths" icon={TrendingUp}>
                      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {analysis.swot.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </RecipeCard>
                    <RecipeCard title="Weaknesses" icon={ShieldAlert}>
                      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {analysis.swot.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                    </RecipeCard>
                    <RecipeCard title="Opportunities" icon={Zap}>
                      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {analysis.swot.opportunities.map((o, i) => <li key={i}>• {o}</li>)}
                      </ul>
                    </RecipeCard>
                    <RecipeCard title="Threats" icon={AlertTriangle}>
                      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {analysis.swot.threats.map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </RecipeCard>
                  </motion.div>
                )}

                {analysisMode === 'comparison' && analysis.comparison && (
                  <motion.div
                    key="comparison"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden"
                  >
                    <div className="p-6 border-b border-[var(--border-color)] flex items-center gap-3">
                      <TableIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100">Comparison Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[var(--bg-secondary)]">
                            {analysis.comparison.headers.map((header, i) => (
                              <th key={i} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-[var(--border-color)]">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {analysis.comparison.rows.map((row, i) => (
                            <tr key={i} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors">
                              {row.map((cell, j) => (
                                <td key={j} className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center pt-8"
              >
                <button 
                  onClick={handleSaveToHistory}
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 px-12 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                >
                  {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                  <span className="text-lg">{saving ? 'Saving...' : 'Save this Decision to History'}</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-[var(--border-color)] text-center">
        <p className="text-zinc-500 dark:text-zinc-500 text-sm">
          Powered by Gemini AI • Make decisions responsibly
        </p>
      </footer>
    </div>
  );
}
