```tsx
import React, { useState } from "react";

const QuizBattle: React.FC = () => {
  const [score, setScore] = useState<number>(0);

  const correctAnswer = () => {
    setScore(score + 1);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <h2 className="text-xl font-bold mb-4">⚔️ Quiz Battle</h2>

      <p className="mb-4">What is 5 + 5 ?</p>

      <div className="space-x-3">
        <button
          onClick={correctAnswer}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          10
        </button>

        <button className="bg-red-500 text-white px-4 py-2 rounded">
          12
        </button>
      </div>

      <p className="mt-4">Score: {score}</p>
    </div>
  );
};

export default QuizBattle;
```
