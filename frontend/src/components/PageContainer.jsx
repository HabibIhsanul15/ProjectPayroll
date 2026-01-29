export default function PageContainer({ title, children }) {
  return (
    <div style={styles.wrapper}>
      {title && <h1 style={styles.title}>{title}</h1>}

      <div style={styles.card}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
  },
};
