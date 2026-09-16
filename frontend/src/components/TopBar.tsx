import './TopBar.css'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type TopBarProps = {
  title: string
  showBack?: boolean
}

export default function TopBar({ title, showBack = false }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <div className="topbar">
      {showBack && <button className="back" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={17} strokeWidth={2} /></button>}
      <img src="/crescent-logo-white.png" alt="Crescent" />
      <h1>{title}</h1>
    </div>
  )
}