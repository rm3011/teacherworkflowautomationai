import { Routes, Route, useLocation } from 'react-router-dom'
import TopBar from './components/TopBar'
import Home from './pages/Home'
import Classes from './pages/Classes'
import ClassDetail from './pages/ClassDetail'

const TITLES: Record<string, string> = {
  '/': 'Crescent Teacher Workflow AI',
  '/classes': 'Classes',
}

function getTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname]
  if (pathname.startsWith('/classes/')) {
    const classId = pathname.split('/')[2]
    return classId ?? 'Class'
  }
  return 'Crescent Teacher Workflow AI'
}

export default function App() {
  const { pathname } = useLocation()
  const showBack = pathname !== '/'

  return (
    <div className="app">
      <TopBar title={getTitle(pathname)} showBack={showBack} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/classes/:classId" element={<ClassDetail />} />
      </Routes>
    </div>
  )
}