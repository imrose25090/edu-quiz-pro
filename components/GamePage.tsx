import SpinWheelGame from './games/SpinWheelGame';
import MemoryGame from './games/MemoryGame';
import QuizBattle from './games/QuizBattle';
import PuzzleGame from './games/PuzzleGame';

export default function GamePage() {
  return (
    <div>
      <h1>🎮 Quiz Games</h1>
      <SpinWheelGame />
      <MemoryGame />
      <QuizBattle />
      <PuzzleGame />
    </div>
  );
}
export default GamePage;