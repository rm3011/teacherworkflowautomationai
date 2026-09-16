import './TopBar.css'
import { useNavigate } from 'react-router-dom'

type TopBarProps = {
  title: string
  showBack?: boolean
}

export default function TopBar({ title, showBack = false }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <div className="topbar">
      {showBack && <button className="back" onClick={() => navigate(-1)} aria-label="Go back">←</button>}
      <img src="/crescent-logo-white.png" alt="Crescent" />
      <h1>{title}</h1>
    </div>
  )
}