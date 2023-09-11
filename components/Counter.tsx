import { useState } from "npm:preact/hooks";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((count) => count + 1)}>
      count: {count}
    </button>
  );
}
