export default function Modal({ show, onClose, size = "", children }) {
  if (!show) return null
  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className={`modal-dialog modal-dialog-centered ${size}`}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {children}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  )
}
