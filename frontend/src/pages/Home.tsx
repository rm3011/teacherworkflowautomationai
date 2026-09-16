import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Building2 } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  return (
    <>
      <div className="page">
        <h2>Welcome</h2>
        <p className="sub">Pick a class to get started.</p>

        <button className="menu-card" onClick={() => navigate('/classes')}>
          <div className="menu-icon"><Building2 size={25} strokeWidth={1.8} /></div>
          <div className="menu-text">
            <h3>My Classes</h3>
            <p>CSE · AIDS · CYBER</p>
          </div>
          <ArrowUpRight className="menu-arrow" size={20} strokeWidth={1.8} />
        </button>
      </div>
    </>
  )
}