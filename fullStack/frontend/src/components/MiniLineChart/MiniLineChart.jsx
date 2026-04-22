import "./MiniLineChart.css";

export default function MiniLineChart({ data }) {
  return (
    <div className="mini-line-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="var(--vio)"
          strokeWidth="2"
          points={data
            .map((value, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - value; // invertimos para que 100 esté arriba
              return `${x},${y}`;
            })
            .join(" ")}
        />
      </svg>
    </div>
  );
}
