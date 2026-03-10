import React, { useState } from "react";

const topics = ["Math", "Science", "English", "GK"];

const SpinWheelGame: React.FC = () => {
  const [topic, setTopic] = useState<string>("");

  const spinWheel = () => {
    const random = topics[Math.floor(Math.random() * topics.length)];
    setTopic(random);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <h2 className="text-xl font-bold mb-4">🎡 Spin Wheel Quiz</h2>

      <button
        onClick={spinWheel}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg"
      >
        Spin
      </button>

      {topic && (
        <p className="mt-4 text-lg font-semibold">
          Topic: {topic}
        </p>
      )}
    </div>
  );
};

export default SpinWheelGame;
