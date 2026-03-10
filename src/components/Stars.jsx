export default function Stars({ value, max = 5, interactive = false, size = '', onSelect }) {
  return (
    <div className="stars">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`star ${i < value ? 'filled' : ''} ${interactive ? 'interactive' : ''} ${size}`}
          onClick={() => interactive && onSelect && onSelect(i + 1)}
        >
          ★
        </span>
      ))}
    </div>
  )
}
