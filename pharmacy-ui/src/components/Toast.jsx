import { useEffect } from "react"

export default function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-msg t-${t.type}`}>
          <i className={`bi ${t.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
          {t.msg}
        </div>
      ))}
    </div>
  )
}
