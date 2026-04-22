import "./MiniBarChart.css";

export default function MiniBarChart({ data }) {
  return (
    <div className="mini-bar-chart">
      {data.map((value, index) => (
        <div
          key={index}
          className="bar"
          style={{ height: `${value}%` }}
        ></div>
      ))}
    </div>
  );
}
