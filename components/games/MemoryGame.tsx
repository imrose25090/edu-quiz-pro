import React, { useState } from "react";

const cardsData = [
  { id: 1, text: "2+2", match: "4" },
  { id: 2, text: "4", match: "2+2" },
  { id: 3, text: "Capital of BD", match: "Dhaka" },
  { id: 4, text: "Dhaka", match: "Capital of BD" },
];

const MemoryGame: React.FC = () => {
  const [flipped, setFlipped] = useState<number[]>([]);

  const handleClick = (id: number) => {
    if (flipped.includes(id)) return;
    setFlipped([...flipped, id]);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">🧠 Memory Match</h2>

      <div className="grid grid-cols-2 gap-4">
        {cardsData.map((card) => (
          <div
            key={card.id}
            onClick={() => handleClick(card.id)}
            className="bg-blue-100 p-4 text-center rounded-lg cursor-pointer"
          >
            {flipped.includes(card.id) ? card.text : "?"}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryGame;
