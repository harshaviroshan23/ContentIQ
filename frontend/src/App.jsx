
import { useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell,
  BrainCircuit, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleHelp, CloudUpload, Download, Eye, FileSpreadsheet,
  Filter, LayoutDashboard, Lightbulb, Menu, MoreHorizontal,
  MousePointerClick, Search, Settings, Sparkles, Target,
  TrendingUp, Users, X, Zap, Trash2, Plus, Calendar,
  FileText, RefreshCw
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis, BarChart, Bar
} from 'recharts'
import './App.css'
import Chatbot from './Chatbot'

const initialContent = [
  { id: 1, title: 'Summer Campaign', platform: 'Instagram', type: 'Reel', views: 12500, reach: 9200, engagementRate: 8.4, date: '2026-11-10' },
  { id: 2, title: 'Product Launch', platform: 'YouTube', type: 'Video', views: 18500, reach: 14200, engagementRate: 7.8, date: '2026-11-11' },
  { id: 3, title: 'Behind the Scenes', platform: 'LinkedIn', type: 'Post', views: 6800, reach: 4900, engagementRate: 5.2, date: '2026-11-12' },
  { id: 4, title: 'Marketing Tips', platform: 'Instagram', type: 'Carousel', views: 15400, reach: 11200, engagementRate: 9.1, date: '2026-11-12' },
  { id: 5, title: 'Customer Story', platform: 'YouTube', type: 'Video', views: 22400, reach: 17400, engagementRate: 6.9, date: '2026-11-13' }
]

const initialData = [
  { date: 'Nov 10', views: 12500 },
  { date: 'Nov 11', views: 18500 },
  { date: 'Nov 12', views: 22200 },
  { date: 'Nov 13', views: 22400 },
  { date: 'Nov 14', views: 18000 },
  { date: 'Nov 15', views: 25000 },
  { date: 'Nov 16', views: 21000 }
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Content analytics', icon: BarChart3 },
  { label: 'Content library', icon: FileSpreadsheet },
  { label: 'AI insights', icon: BrainCircuit },
  { label: 'Strategy planner', icon: Target }
]

const formatNumber = value => new Intl.NumberFormat('en-IN').format(Math.round(value || 0))

const compactNumber = value => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return formatNumber(value)
}

const parseNumber = value => {
  const number = Number(String(value ?? '').replace(/[% ,]/g, ''))
  return Number.isFinite(number) ? number : 0
}

const getColumn = (headers, names) => headers.findIndex(header =>
  names.some(name => header.toLowerCase().replace(/[\s_-]/g, '').includes(name))
)

function parseCSV(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '"' && quoted && text[i + 1] === '"') {
      cell += '"'
      i++
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim())
      if (row.some(value => value !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  row.push(cell.trim())
  if (row.some(value => value !== '')) rows.push(row)

  return rows
}

function parseContentCSV(text) {
  const rows = parseCSV(text)

  if (rows.length < 2) {
    throw new Error('The CSV file has no content rows.')
  }

  const headers = rows[0].map(header => header.toLowerCase().trim())
  const titleIndex = getColumn(headers, ['title', 'content', 'name'])
  const viewsIndex = getColumn(headers, ['views', 'viewcount', 'impressions'])
  const platformIndex = getColumn(headers, ['platform', 'channel', 'network'])
  const reachIndex = getColumn(headers, ['reach'])
  const engagementIndex = getColumn(headers, ['engagementrate', 'engagement', 'interactions'])
  const typeIndex = getColumn(headers, ['type', 'format', 'contenttype'])
  const dateIndex = getColumn(headers, ['date', 'published'])

  if (titleIndex === -1 || viewsIndex === -1) {
    throw new Error('Your CSV must contain at least a title and views column.')
  }

  return rows.slice(1).map((row, index) => {
    const engagementValue = engagementIndex >= 0 ? parseNumber(row[engagementIndex]) : 0
    const engagementHeader = engagementIndex >= 0 ? headers[engagementIndex] : ''
    const isRate = engagementHeader.includes('rate') ||
      engagementHeader.includes('%') ||
      String(row[engagementIndex] || '').includes('%')

    return {
      id: Date.now() + index,
      title: row[titleIndex] || `Content ${index + 1}`,
      platform: platformIndex >= 0 && row[platformIndex] ? row[platformIndex] : 'Other',
      views: parseNumber(row[viewsIndex]),
      reach: reachIndex >= 0 ? parseNumber(row[reachIndex]) : 0,
      engagementRate: isRate ? engagementValue : 0,
      engagements: isRate ? 0 : engagementValue,
      type: typeIndex >= 0 && row[typeIndex] ? row[typeIndex] : 'Other',
      date: dateIndex >= 0 ? row[dateIndex] : ''
    }
  })
}

function getEngagement(item) {
  if (item.engagementRate > 0) return item.engagementRate
  if (item.engagements > 0 && item.views > 0) return item.engagements / item.views * 100
  return 0
}

function getDate(item) {
  const date = new Date(item.date)
  return Number.isNaN(date.getTime()) ? null : date
}

function MetricCard({ title, value, change, icon: Icon, note }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{title}</span>
        <span className="metric-icon"><Icon size={19} /></span>
      </div>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
        {change && <span className="metric-change"><ArrowUpRight size={14} /> {change}</span>}
      </div>
      <span className="metric-note">{note}</span>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [period, setPeriod] = useState('All time')
  const [search, setSearch] = useState('')
  const [libraryPlatform, setLibraryPlatform] = useState('All platforms')
  const [libraryType, setLibraryType] = useState('All types')
  const [librarySort, setLibrarySort] = useState('views')
  const [content, setContent] = useState(initialContent)
  const [notification, setNotification] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isImported, setIsImported] = useState(false)
  const [plans, setPlans] = useState([])
  const [planTitle, setPlanTitle] = useState('')
  const [planPlatform, setPlanPlatform] = useState('Instagram')
  const [planType, setPlanType] = useState('Reel')
  const [planGoal, setPlanGoal] = useState('Engagement')
  const [planDate, setPlanDate] = useState('')
  const fileRef = useRef(null)

  const showNotice = message => {
    setNotification(message)
    window.setTimeout(() => setNotification(''), 3200)
  }

  const periodContent = useMemo(() => {
    if (period === 'All time') return content

    const dated = content.map(item => ({ ...item, parsedDate: getDate(item) }))
    const validDates = dated.filter(item => item.parsedDate)

    if (!validDates.length) return content

    const latest = new Date(Math.max(...validDates.map(item => item.parsedDate.getTime())))
    const days = period === 'Last 7 days' ? 7 : period === 'Last 30 days' ? 30 : 90
    const cutoff = new Date(latest)
    cutoff.setDate(cutoff.getDate() - days + 1)

    return dated.filter(item => !item.parsedDate || item.parsedDate >= cutoff)
  }, [content, period])

  const metrics = useMemo(() => {
    const views = periodContent.reduce((sum, item) => sum + item.views, 0)
    const reach = periodContent.reduce((sum, item) => sum + item.reach, 0)

    const engagements = periodContent.reduce((sum, item) => {
      return sum + (item.engagements || item.views * (item.engagementRate || 0) / 100)
    }, 0)

    const engagementRate = views ? engagements / views * 100 : 0

    return { views, reach, engagementRate, count: periodContent.length }
  }, [periodContent])

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.platform.toLowerCase().includes(search.toLowerCase())

      const matchesPlatform = libraryPlatform === 'All platforms' || item.platform === libraryPlatform
      const matchesType = libraryType === 'All types' || item.type === libraryType

      return matchesSearch && matchesPlatform && matchesType
    }).sort((a, b) => {
      if (librarySort === 'views') return b.views - a.views
      if (librarySort === 'engagement') return getEngagement(b) - getEngagement(a)
      return String(b.date).localeCompare(String(a.date))
    })
  }, [content, search, libraryPlatform, libraryType, librarySort])

  const platforms = useMemo(() => {
    const groups = {}

    periodContent.forEach(item => {
      if (!groups[item.platform]) {
        groups[item.platform] = {
          platform: item.platform,
          views: 0,
          reach: 0,
          posts: 0,
          engagementTotal: 0
        }
      }

      groups[item.platform].views += item.views
      groups[item.platform].reach += item.reach
      groups[item.platform].posts++
      groups[item.platform].engagementTotal += getEngagement(item)
    })

    return Object.values(groups).map(group => ({
      ...group,
      avgEngagement: group.posts ? group.engagementTotal / group.posts : 0
    })).sort((a, b) => b.views - a.views)
  }, [periodContent])

  const types = useMemo(() => {
    const groups = {}

    periodContent.forEach(item => {
      if (!groups[item.type]) {
        groups[item.type] = {
          type: item.type,
          views: 0,
          posts: 0,
          engagementTotal: 0
        }
      }

      groups[item.type].views += item.views
      groups[item.type].posts++
      groups[item.type].engagementTotal += getEngagement(item)
    })

    return Object.values(groups).map(group => ({
      ...group,
      avgEngagement: group.posts ? group.engagementTotal / group.posts : 0
    })).sort((a, b) => b.views - a.views)
  }, [periodContent])

  const chartData = useMemo(() => {
    const dated = periodContent.filter(item => getDate(item))

    if (!dated.length) return initialData

    const groups = {}

    dated.forEach(item => {
      const date = getDate(item)
      const key = date.toISOString().slice(0, 10)
      groups[key] = (groups[key] || 0) + item.views
    })

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, views]) => ({
        date: new Date(date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short'
        }),
        views
      }))
  }, [periodContent])

  const topContent = [...periodContent].sort((a, b) => b.views - a.views).slice(0, 5)
  const bestPost = [...periodContent].sort((a, b) => getEngagement(b) - getEngagement(a))[0]
  const bestPlatform = [...platforms].sort((a, b) => b.avgEngagement - a.avgEngagement)[0]
  const bestType = [...types].sort((a, b) => b.avgEngagement - a.avgEngagement)[0]

  const lowPost = [...periodContent]
    .filter(item => getEngagement(item) > 0)
    .sort((a, b) => getEngagement(a) - getEngagement(b))[0]

  const averageEngagement = periodContent.length
    ? periodContent.reduce((sum, item) => sum + getEngagement(item), 0) / periodContent.length
    : 0

  const handleImport = event => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      try {
        const parsed = parseContentCSV(String(reader.result || ''))

        if (!parsed.length) {
          throw new Error('No usable content rows found.')
        }

        setContent(parsed)
        setIsImported(true)
        setPeriod('All time')
        setSearch('')
        setActiveNav('Overview')
        showNotice(`Successfully imported ${parsed.length} content records.`)
      } catch (error) {
        showNotice(error.message || 'Could not read this CSV file.')
      }

      event.target.value = ''
    }

    reader.onerror = () => showNotice('Unable to read this file.')
    reader.readAsText(file)
  }

  const exportCSV = () => {
    const headers = ['title', 'platform', 'type', 'views', 'reach', 'engagement_rate', 'date']

    const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`

    const rows = content.map(item => [
      item.title,
      item.platform,
      item.type,
      item.views,
      item.reach,
      getEngagement(item),
      item.date
    ].map(escape).join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')

    link.href = url
    link.download = 'minnal-report.csv'
    link.click()

    URL.revokeObjectURL(url)
    showNotice('Your MINNAL report has been exported.')
  }

  const deleteContent = id => {
    setContent(current => current.filter(item => item.id !== id))
    showNotice('Content record removed.')
  }

  const addPlan = event => {
    event.preventDefault()

    if (!planTitle.trim()) {
      showNotice('Enter a title for your content plan.')
      return
    }

    setPlans(current => [...current, {
      id: Date.now(),
      title: planTitle.trim(),
      platform: planPlatform,
      type: planType,
      goal: planGoal,
      date: planDate
    }])

    setPlanTitle('')
    setPlanDate('')
    showNotice('Your content plan has been added.')
  }

  const recommendedPlatform = bestPlatform?.platform || 'Instagram'
  const recommendedType = bestType?.type || 'Reel'

  const pageTitle = {
    Overview: 'Overview',
    'Content analytics': 'Content analytics',
    'Content library': 'Content library',
    'AI insights': 'AI insights',
    'Strategy planner': 'Strategy planner'
  }[activeNav]

  const navigate = label => {
    setActiveNav(label)
    setSidebarOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Zap size={22} /></div>
          <div>
            <strong>MINNAL</strong>
            <span>STRIKE WITH INSIGHT.</span>
          </div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <div className="workspace-switch">
          <div className="workspace-avatar">M</div>
          <div>
            <strong>Creator workspace</strong>
            <span>Free workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">MENU</div>

        <nav className="main-nav">
          {navItems.map(item => {
            const Icon = item.icon

            return (
              <button
                key={item.label}
                className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
                onClick={() => navigate(item.label)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {activeNav === item.label && <span className="nav-active-dot" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon"><CircleHelp size={18} /></div>
            <div>
              <strong>Need help?</strong>
              <span>Explore your workspace</span>
            </div>
            <ChevronRight size={15} />
          </div>

          <div className="profile-row">
            <div className="profile-avatar">H</div>
            <div>
              <strong>Workspace admin</strong>
              <span>Administrator</span>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <span className="breadcrumb">MINNAL</span>
            <ChevronRight size={14} />
            <strong>{pageTitle}</strong>
          </div>

          <div className="topbar-right">
            <span className="live-status"><span /> Data workspace</span>
            <button className="icon-button" title="Notifications"><Bell size={18} /></button>
            <button className="icon-button" title="Settings"><Settings size={18} /></button>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <div className="welcome-kicker">MINNAL · STRIKE WITH INSIGHT</div>
              <h1>{pageTitle}</h1>
              <p>
                {activeNav === 'Overview' && 'Your content performance, all in one place.'}
                {activeNav === 'Content analytics' && 'Understand what works across your content channels.'}
                {activeNav === 'Content library' && 'Explore, search and manage your published content.'}
                {activeNav === 'AI insights' && 'Turn your performance data into actionable decisions.'}
                {activeNav === 'Strategy planner' && 'Plan your next content moves using performance trends.'}
              </p>
            </div>

            <div className="welcome-actions">
              <select
                className="period-select"
                value={period}
                onChange={event => setPeriod(event.target.value)}
              >
                <option>All time</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>

              <button className="primary-button" onClick={() => fileRef.current?.click()}>
                <CloudUpload size={16} /> Import CSV
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={handleImport}
              />
            </div>
          </div>

          {activeNav === 'Overview' && (
            <>
              <div className="metrics-grid">
                <MetricCard
                  title="Total views"
                  value={compactNumber(metrics.views)}
                  change="Performance"
                  icon={Eye}
                  note="Views across selected content"
                />
                <MetricCard
                  title="Total reach"
                  value={compactNumber(metrics.reach)}
                  icon={Users}
                  note="Combined audience reach"
                />
                <MetricCard
                  title="Engagement rate"
                  value={`${metrics.engagementRate.toFixed(2)}%`}
                  icon={Activity}
                  note="Weighted engagement rate"
                />
                <MetricCard
                  title="Published content"
                  value={formatNumber(metrics.count)}
                  icon={FileText}
                  note="Content records in this period"
                />
              </div>

              <div className="analytics-grid">
                <section className="panel performance-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-eyebrow">PERFORMANCE</span>
                      <h3>Views over time</h3>
                      <p>Content views across your selected period</p>
                    </div>
                    <span className="panel-tag"><TrendingUp size={14} /> Views</span>
                  </div>

                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#42d98b" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#42d98b" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 5" stroke="rgba(164,194,173,.10)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#91a397', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={compactNumber} tick={{ fill: '#91a397', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: '#142019',
                            border: '1px solid rgba(164,194,173,.18)',
                            borderRadius: 10,
                            color: '#e8f0eb'
                          }}
                          formatter={value => formatNumber(value)}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#42d98b"
                          strokeWidth={2.5}
                          fill="url(#viewsGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="panel insights-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-eyebrow">QUICK ANALYSIS</span>
                      <h3>Performance signals</h3>
                      <p>Highlights from your dataset</p>
                    </div>
                    <Sparkles size={19} className="green-icon" />
                  </div>

                  <div className="insight-list">
                    <div className="insight-item">
                      <span className="insight-symbol"><TrendingUp size={17} /></span>
                      <div>
                        <strong>Top performing content</strong>
                        <p>{bestPost ? `${bestPost.title} · ${compactNumber(bestPost.views)} views` : 'Import data to discover your top post.'}</p>
                      </div>
                    </div>

                    <div className="insight-item">
                      <span className="insight-symbol"><Target size={17} /></span>
                      <div>
                        <strong>Leading platform</strong>
                        <p>{bestPlatform ? `${bestPlatform.platform} leads by average engagement.` : 'Platform data will appear here.'}</p>
                      </div>
                    </div>

                    <div className="insight-item">
                      <span className="insight-symbol"><Zap size={17} /></span>
                      <div>
                        <strong>Engagement benchmark</strong>
                        <p>{averageEngagement ? `Your average engagement is ${averageEngagement.toFixed(2)}%.` : 'Add engagement data for a benchmark.'}</p>
                      </div>
                    </div>
                  </div>

                  <button className="text-link" onClick={() => navigate('AI insights')}>
                    Explore all insights <ChevronRight size={15} />
                  </button>
                </section>
              </div>

              <div className="bottom-grid">
                <section className="panel content-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-eyebrow">CONTENT</span>
                      <h3>Top performing content</h3>
                      <p>Ranked by total views</p>
                    </div>
                    <button className="text-link" onClick={() => navigate('Content library')}>
                      View library <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>CONTENT</th>
                          <th>PLATFORM</th>
                          <th>VIEWS</th>
                          <th>ENGAGEMENT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topContent.map(item => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.title}</strong>
                              <span className="table-subtitle">{item.type}</span>
                            </td>
                            <td>{item.platform}</td>
                            <td>{formatNumber(item.views)}</td>
                            <td>{getEngagement(item).toFixed(2)}%</td>
                          </tr>
                        ))}
                        {!topContent.length && (
                          <tr><td colSpan="4">No content available.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="panel platform-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-eyebrow">CHANNEL MIX</span>
                      <h3>Platform performance</h3>
                      <p>Views by platform</p>
                    </div>
                  </div>

                  <div className="chart-wrap small-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platforms} layout="vertical" margin={{ top: 0, right: 15, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 5" stroke="rgba(164,194,173,.08)" horizontal={false} />
                        <XAxis type="number" tickFormatter={compactNumber} tick={{ fill: '#91a397', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="platform" width={75} tick={{ fill: '#91a397', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: '#142019',
                            border: '1px solid rgba(164,194,173,.18)',
                            borderRadius: 10,
                            color: '#e8f0eb'
                          }}
                        />
                        <Bar dataKey="views" fill="#42d98b" radius={[0, 5, 5, 0]} barSize={17} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            </>
          )}

          {activeNav === 'Content analytics' && (
            <>
              <div className="metrics-grid">
                <MetricCard title="Analysed views" value={compactNumber(metrics.views)} icon={Eye} note="Total views in selected period" />
                <MetricCard title="Platforms" value={platforms.length} icon={BarChart3} note="Active channels in your data" />
                <MetricCard title="Content formats" value={types.length} icon={FileText} note="Different formats analysed" />
                <MetricCard title="Average engagement" value={`${averageEngagement.toFixed(2)}%`} icon={Activity} note="Average across content records" />
              </div>

              <div className="analytics-grid">
                <section className="panel performance-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-eyebrow">CHANNEL ANALYSIS</span>
                      <h3>Platform comparison</h3>
                      <p>Views generated by each platform</p>
                    </div>
                  </div>

                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platforms} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 5" stroke="rgba(164,194,173,.10)" vertical={false} />
                        <XAxis dataKey="platform" tick={{ fill: '#91a397', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={compactNumber} tick={{ fill: '#91a397', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: '#142019',
                            border: '1px solid rgba(164,194,173,.18)',
                            borderRadius: 10,
                            color: '#e8f0eb'
                          }}
                        />
                        <Bar dataKey="views" fill="#42d98b" radius={[6, 6, 0, 0]} barSize={38} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="panel performance-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-eyebrow">FORMAT ANALYSIS</span>
                      <h3>Content type performance</h3>
                      <p>Views generated by content format</p>
                    </div>
                  </div>

                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={types} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 5" stroke="rgba(164,194,173,.10)" vertical={false} />
                        <XAxis dataKey="type" tick={{ fill: '#91a397', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={compactNumber} tick={{ fill: '#91a397', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: '#142019',
                            border: '1px solid rgba(164,194,173,.18)',
                            borderRadius: 10,
                            color: '#e8f0eb'
                          }}
                        />
                        <Bar dataKey="views" fill="#8ceab2" radius={[6, 6, 0, 0]} barSize={38} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              <section className="panel content-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-eyebrow">RANKING</span>
                    <h3>Content performance breakdown</h3>
                    <p>Compare individual content records</p>
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>CONTENT</th>
                        <th>PLATFORM</th>
                        <th>TYPE</th>
                        <th>VIEWS</th>
                        <th>REACH</th>
                        <th>ENGAGEMENT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...periodContent].sort((a, b) => b.views - a.views).map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.title}</strong></td>
                          <td>{item.platform}</td>
                          <td>{item.type}</td>
                          <td>{formatNumber(item.views)}</td>
                          <td>{formatNumber(item.reach)}</td>
                          <td>{getEngagement(item).toFixed(2)}%</td>
                        </tr>
                      ))}
                      {!periodContent.length && (
                        <tr><td colSpan="6">Import a CSV file to analyse your content.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeNav === 'Content library' && (
            <div className="library-page">
              <div className="library-summary-grid">
                <div className="library-summary-card">
                  <span>Total records</span>
                  <strong>{content.length}</strong>
                </div>
                <div className="library-summary-card">
                  <span>Total views</span>
                  <strong>{compactNumber(content.reduce((sum, item) => sum + item.views, 0))}</strong>
                </div>
                <div className="library-summary-card">
                  <span>Platforms</span>
                  <strong>{new Set(content.map(item => item.platform)).size}</strong>
                </div>
                <div className="library-summary-card">
                  <span>Content formats</span>
                  <strong>{new Set(content.map(item => item.type)).size}</strong>
                </div>
              </div>

              <section className="panel library-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-eyebrow">CONTENT MANAGEMENT</span>
                    <h3>All content</h3>
                    <p>Search, filter, sort and manage your records</p>
                  </div>
                  <button className="secondary-button" onClick={exportCSV}>
                    <Download size={15} /> Export CSV
                  </button>
                </div>

                <div className="library-toolbar">
                  <div className="library-search">
                    <Search size={17} />
                    <input
                      placeholder="Search content or platform..."
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                    />
                  </div>

                  <select
                    className="library-select"
                    value={libraryPlatform}
                    onChange={event => setLibraryPlatform(event.target.value)}
                  >
                    <option>All platforms</option>
                    {[...new Set(content.map(item => item.platform))].map(platform => (
                      <option key={platform}>{platform}</option>
                    ))}
                  </select>

                  <select
                    className="library-select"
                    value={libraryType}
                    onChange={event => setLibraryType(event.target.value)}
                  >
                    <option>All types</option>
                    {[...new Set(content.map(item => item.type))].map(type => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>

                  <select
                    className="library-select"
                    value={librarySort}
                    onChange={event => setLibrarySort(event.target.value)}
                  >
                    <option value="views">Sort: Views</option>
                    <option value="engagement">Sort: Engagement</option>
                    <option value="date">Sort: Newest</option>
                  </select>
                </div>

                <div className="table-scroll">
                  <table className="data-table library-table">
                    <thead>
                      <tr>
                        <th>CONTENT</th>
                        <th>PLATFORM</th>
                        <th>TYPE</th>
                        <th>VIEWS</th>
                        <th>REACH</th>
                        <th>ENGAGEMENT</th>
                        <th>DATE</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContent.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.title}</strong></td>
                          <td>{item.platform}</td>
                          <td>{item.type}</td>
                          <td>{formatNumber(item.views)}</td>
                          <td>{formatNumber(item.reach)}</td>
                          <td>{getEngagement(item).toFixed(2)}%</td>
                          <td>{item.date || '—'}</td>
                          <td>
                            <button
                              className="delete-content-button"
                              title="Delete record"
                              onClick={() => deleteContent(item.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!filteredContent.length && (
                        <tr>
                          <td colSpan="8" className="empty-state">No matching content records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="library-footer">
                  <span>Showing {filteredContent.length} of {content.length} records</span>
                  <button
                    className="text-link"
                    onClick={() => {
                      setSearch('')
                      setLibraryPlatform('All platforms')
                      setLibraryType('All types')
                      setLibrarySort('views')
                    }}
                  >
                    Clear filters <RefreshCw size={14} />
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeNav === 'AI insights' && (
            <>
              <div className="insights-intro">
                <div className="insights-intro-icon"><BrainCircuit size={25} /></div>
                <div>
                  <strong>Your data, translated into decisions.</strong>
                  <p>MINNAL analyses your imported records locally to identify patterns and opportunities.</p>
                </div>
                <span className="analysis-label"><span /> LOCAL ANALYSIS</span>
              </div>

              <div className="insight-cards-grid">
                <div className="insight-detail-card">
                  <span className="insight-card-icon"><TrendingUp size={19} /></span>
                  <span className="panel-eyebrow">TOP CONTENT</span>
                  <h3>{bestPost?.title || 'Awaiting data'}</h3>
                  <p>{bestPost ? `${formatNumber(bestPost.views)} views · ${getEngagement(bestPost).toFixed(2)}% engagement` : 'Import a CSV to identify your strongest post.'}</p>
                </div>

                <div className="insight-detail-card">
                  <span className="insight-card-icon"><Target size={19} /></span>
                  <span className="panel-eyebrow">LEADING PLATFORM</span>
                  <h3>{bestPlatform?.platform || 'Awaiting data'}</h3>
                  <p>{bestPlatform ? `${bestPlatform.avgEngagement.toFixed(2)}% average engagement across ${bestPlatform.posts} records` : 'Platform comparisons will appear here.'}</p>
                </div>

                <div className="insight-detail-card">
                  <span className="insight-card-icon"><Zap size={19} /></span>
                  <span className="panel-eyebrow">STRONGEST FORMAT</span>
                  <h3>{bestType?.type || 'Awaiting data'}</h3>
                  <p>{bestType ? `${bestType.avgEngagement.toFixed(2)}% average engagement` : 'Format analysis will appear here.'}</p>
                </div>
              </div>

              <section className="panel recommendations-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-eyebrow">RECOMMENDATIONS</span>
                    <h3>What your data suggests</h3>
                    <p>Practical next steps based on observed performance</p>
                  </div>
                  <Sparkles size={20} className="green-icon" />
                </div>

                <div className="recommendation-list">
                  <div className="recommendation-row">
                    <span className="recommendation-number">01</span>
                    <div>
                      <strong>Prioritise your strongest channel</strong>
                      <p>{bestPlatform ? `${bestPlatform.platform} has the highest average engagement in the current dataset. Consider testing more content there.` : 'Import platform-level content data to identify your strongest channel.'}</p>
                    </div>
                  </div>

                  <div className="recommendation-row">
                    <span className="recommendation-number">02</span>
                    <div>
                      <strong>Repeat successful formats</strong>
                      <p>{bestType ? `${bestType.type} currently has the strongest average engagement among your content formats. Test another post in this format.` : 'Add content type information to compare formats.'}</p>
                    </div>
                  </div>

                  <div className="recommendation-row">
                    <span className="recommendation-number">03</span>
                    <div>
                      <strong>Review lower-performing content</strong>
                      <p>{lowPost ? `${lowPost.title} has the lowest recorded engagement among posts with engagement data. Review its topic, format and publishing context.` : 'More engagement data is needed to identify content that may need improvement.'}</p>
                    </div>
                  </div>
                </div>
              </section>

              <p className="analysis-disclaimer">
                <Lightbulb size={15} />
                These are rule-based insights calculated from your uploaded dataset. No external AI service or paid API is being used.
              </p>
            </>
          )}

          {activeNav === 'Strategy planner' && (
            <>
              <div className="planner-banner">
                <div>
                  <span className="panel-eyebrow">DATA-ASSISTED PLANNING</span>
                  <h2>Make your next post a smarter one.</h2>
                  <p>Use your strongest channels and formats as a starting point for your next content plan.</p>
                </div>
                <div className="planner-banner-icon"><Target size={34} /></div>
              </div>

              <div className="planner-grid">
                <section className="panel planner-form-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-eyebrow">NEW PLAN</span>
                      <h3>Create content plan</h3>
                      <p>Add an idea to your upcoming content schedule</p>
                    </div>
                    <Plus size={19} className="green-icon" />
                  </div>

                  <form className="planner-form" onSubmit={addPlan}>
                    <label>
                      Content title or idea
                      <input
                        value={planTitle}
                        onChange={event => setPlanTitle(event.target.value)}
                        placeholder="e.g. Behind the scenes of our product"
                      />
                    </label>

                    <div className="planner-form-row">
                      <label>
                        Platform
                        <select value={planPlatform} onChange={event => setPlanPlatform(event.target.value)}>
                          <option>Instagram</option>
                          <option>YouTube</option>
                          <option>LinkedIn</option>
                          <option>Facebook</option>
                          <option>Other</option>
                        </select>
                      </label>

                      <label>
                        Content format
                        <select value={planType} onChange={event => setPlanType(event.target.value)}>
                          <option>Reel</option>
                          <option>Video</option>
                          <option>Post</option>
                          <option>Carousel</option>
                          <option>Article</option>
                          <option>Story</option>
                          <option>Other</option>
                        </select>
                      </label>
                    </div>

                    <div className="planner-form-row">
                      <label>
                        Primary goal
                        <select value={planGoal} onChange={event => setPlanGoal(event.target.value)}>
                          <option>Engagement</option>
                          <option>Reach</option>
                          <option>Views</option>
                          <option>Brand awareness</option>
                          <option>Conversions</option>
                        </select>
                      </label>

                      <label>
                        Planned date
                        <input
                          type="date"
                          value={planDate}
                          onChange={event => setPlanDate(event.target.value)}
                        />
                      </label>
                    </div>

                    <button type="submit" className="primary-button">
                      <Plus size={16} /> Add to plan
                    </button>
                  </form>
                </section>

                <section className="panel planner-recommendation">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-eyebrow">PERFORMANCE-BASED SUGGESTION</span>
                      <h3>What to try next</h3>
                      <p>Based on your current dataset</p>
                    </div>
                    <Sparkles size={19} className="green-icon" />
                  </div>

                  <div className="planner-suggestion">
                    <span>Suggested platform</span>
                    <strong>{recommendedPlatform}</strong>
                    <p>{bestPlatform ? `Currently leads by average engagement (${bestPlatform.avgEngagement.toFixed(2)}%).` : 'Import data to compare platforms.'}</p>
                  </div>

                  <div className="planner-suggestion">
                    <span>Suggested format</span>
                    <strong>{recommendedType}</strong>
                    <p>{bestType ? `Currently leads by average engagement (${bestType.avgEngagement.toFixed(2)}%).` : 'Import data to compare formats.'}</p>
                  </div>

                  <button
                    className="secondary-button full-width"
                    onClick={() => {
                      setPlanPlatform(recommendedPlatform)
                      setPlanType(recommendedType)
                      showNotice('Recommended platform and format selected.')
                    }}
                  >
                    Use these suggestions <ChevronRight size={15} />
                  </button>
                </section>
              </div>

              <section className="panel content-panel planned-content-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-eyebrow">YOUR WORKFLOW</span>
                    <h3>Upcoming content</h3>
                    <p>{plans.length} planned {plans.length === 1 ? 'item' : 'items'}</p>
                  </div>
                  <CalendarDays size={20} className="green-icon" />
                </div>

                {plans.length ? (
                  <div className="planned-list">
                    {plans.map(plan => (
                      <div className="planned-item" key={plan.id}>
                        <div className="planned-date">
                          <Calendar size={17} />
                          <span>
                            {plan.date
                              ? new Date(`${plan.date}T00:00:00`).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })
                              : 'No date'}
                          </span>
                        </div>

                        <div className="planned-main">
                          <strong>{plan.title}</strong>
                          <span>{plan.platform} · {plan.type} · Goal: {plan.goal}</span>
                        </div>

                        <button
                          className="delete-content-button"
                          title="Remove plan"
                          onClick={() => setPlans(current => current.filter(item => item.id !== plan.id))}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-plans">
                    <CalendarDays size={27} />
                    <strong>Your content plan starts here</strong>
                    <p>Add your first idea using the form above.</p>
                  </div>
                )}
              </section>
            </>
          )}

          <footer className="app-footer">
            <span>MINNAL ⚡ · Strike with Insight.</span>
            <span>{isImported ? 'Using your imported dataset' : 'Using sample dataset'} · Local analysis</span>
          </footer>
        </div>
      </main>

      {notification && (
        <div className="toast">
          <Check size={17} /> {notification}
        </div>
      )}

      <Chatbot content={periodContent} />
    </div>
  )
}

export default App
