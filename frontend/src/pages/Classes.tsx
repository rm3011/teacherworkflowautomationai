import { useNavigate } from 'react-router-dom'

type ClassGroup = {
  department: string
  sections: string[]
  accent: 'blue' | 'red' | 'grey'
}

const GROUPS: ClassGroup[] = [
  { department: 'CSE',   sections: ['A', 'B', 'C', 'D'], accent: 'blue' },
  { department: 'AIDS',  sections: ['A', 'B', 'C', 'D'], accent: 'red'  },
  { department: 'CYBER', sections: ['A', 'B', 'C'],      accent: 'grey' },
]

export default function Classes() {
  const navigate = useNavigate()

  return (
    <>
      <div className="page">
        <h2>Select a Class</h2>
        <p className="sub">Choose the class you want to work with.</p>

        {GROUPS.map((group) => (
          <div key={group.department} className="class-group">
            <div className="class-group-label">{group.department}</div>
            <div className="class-grid">
              {group.sections.map((section) => {
                const classId = `${group.department}-${section}`
                return (
                  <button
                    key={classId}
                    className={`class-tile ${group.accent}`}
                    onClick={() => navigate(`/classes/${classId}`)}
                  >
                    <span className="class-tile-dept">{group.department}</span>
                    <span className="class-tile-section">{section}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}