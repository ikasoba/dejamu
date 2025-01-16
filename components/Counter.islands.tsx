import { useState } from "npm:preact/hooks";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className={`filter[hue-rotate(${count % 50 / 50 * 360}deg)]`}>
      <button
        className="btn"
        onClick={() => setCount((count) => count + 1)}
      >
        {count ? `count: ${count}` : "click me!"}
      </button>
    </div>
  );
}
