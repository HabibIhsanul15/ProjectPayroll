export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div style={styles.sheet} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>{title}</div>
            <div style={styles.subtitle}>
              Lengkapi data dengan teliti. Field bertanda opsional boleh dikosongkan.
            </div>
          </div>

          <button style={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },

  // ✅ penting: bikin modal “ngikut layar” dan kontennya bisa scroll
  sheet: {
    width: "min(860px, 96vw)",
    maxHeight: "92vh",          // ✅ biar ga kepotong saat zoom-in
    display: "flex",            // ✅ header + body stack rapi
    flexDirection: "column",
    borderRadius: 20,
    background: "white",
    boxShadow: "0 30px 90px rgba(2, 6, 23, 0.25)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    animation: "modalIn 180ms ease-out",
  },

  header: {
    padding: "18px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid #eef2f7",
    background:
      "linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 60%)",
    flex: "0 0 auto",
  },

  // ✅ body yang scroll, bukan seluruh modal
  body: {
    padding: 20,
    overflow: "auto",
    flex: "1 1 auto",
  },

  title: { fontSize: 18, fontWeight: 900, color: "#0f172a" },
  subtitle: { marginTop: 4, fontSize: 12.5, color: "#64748b" },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    fontWeight: 900,
    color: "#0f172a",
    flex: "0 0 auto",
  },
};
