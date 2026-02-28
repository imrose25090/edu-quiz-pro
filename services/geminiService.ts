// services/geminiService.ts

// আমরা এই ফাংশনগুলোর নাম ঠিক রাখছি যাতে অন্য ফাইলগুলো এরর না দেয়, 
// কিন্তু এগুলো আসলে কোনো কাজ করবে না (যেহেতু আপনি API ব্যবহার করতে চান না)।

export const generateQuestionsAI = async (topic: string, count: number) => {
  console.log("AI Generation is disabled.");
  return []; // ফাঁকা রেজাল্ট পাঠাবে
};

export const solveWithAI = async (question: string) => {
  return "AI is disabled.";
};

export const analyzePerformance = async (results: any) => {
  return "Manual analysis required.";
};