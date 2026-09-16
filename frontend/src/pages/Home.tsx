import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <>
      <div className="page">
        <h2>Welcome</h2>
        <p className="sub">Pick a class to get started.</p>

        <button className="menu-card" onClick={() => navigate('/classes')}>
          <div className="menu-icon">🏫</div>
          <div className="menu-text">
            <h3>My Classes</h3>
            <p>CSE · AIDS · CYBER</p>
          </div>
        </button>
      </div>
    </>
  )
}