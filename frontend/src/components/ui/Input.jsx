export function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={styles.label}>{label}</label>
      <input {...props} style={styles.input(error)} />
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles = {
  label: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
    display: "block",
  },
  input: (error) => ({
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${error ? "#fca5a5" : "#e5e7eb"}`,
    outline: "none",
    fontFamily: "Inter",
  }),
  error: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
};
