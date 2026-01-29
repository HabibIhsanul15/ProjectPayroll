export function Table({ children }) {
  return <div style={styles.wrap}>{children}</div>;
}

export function TableHeader({ children }) {
  return <div style={styles.header}>{children}</div>;
}

export function TableBody({ children }) {
  return <div style={styles.body}>{children}</div>;
}

export function Row({ children, header = false }) {
  return (
    <div
      style={{
        ...styles.row,
        ...(header ? styles.rowHeader : styles.rowBody),
      }}
    >
      {children}
    </div>
  );
}

export function Cell({ children, w, align = "left", muted = false, bold = false }) {
  return (
    <div
      style={{
        ...styles.cell,
        width: w,
        textAlign: align,
        color: muted ? "#6b7280" : "#111827",
        fontWeight: bold ? 700 : 400,
      }}
    >
      {children}
    </div>
  );
}

const styles = {
  wrap: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    background: "#ffffff",
  },
  header: {
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
  },
  body: {},
  row: {
    display: "flex",
    gap: 12,
    padding: "12px 14px",
    alignItems: "center",
  },
  rowHeader: {
    fontSize: 12,
    color: "#374151",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  rowBody: {
    fontSize: 13,
    borderBottom: "1px solid #f1f5f9",
  },
  cell: {
    flex: 1,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
