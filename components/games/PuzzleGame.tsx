import React, { useState } from "react";

const PuzzleGame: React.FC = () => {
  const [pieces, setPieces] = useState<number>(0);

  const solve = () => {
    if (pieces < 4) {
      setPieces(pieces + 1);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <h2 className="text-xl font-bold mb-4">🧩 Puzzle Quiz</h2>

      <button
        onClick={solve}
        className="bg-purple-500 text-white px-6 py-2 rounded-lg"
      >
        Solve Question
      </button>

      <p className="mt-4">
        Puzzle Pieces Collected: {pieces}/4
      </p>

      {pieces === 4 && (
        <p className="text-green-600 font-bold mt-2">
          🎉 Puzzle Completed!
        </p>
      )}
    </div>
  );
};

export default PuzzleGame;
