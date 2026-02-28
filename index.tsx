import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // এটি পাশের App.tsx ফাইল থেকে মেইন লজিক নিয়ে আসবে

// HTML ফাইলের 'root' আইডিটি খুঁজে বের করা
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element. Make sure index.html has <div id="root"></div>');
}

// রিঅ্যাক্ট অ্যাপ রেন্ডার করা
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);