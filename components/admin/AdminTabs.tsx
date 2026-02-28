import React from 'react';

// প্রপস ইন্টারফেস ডেফিনিশন
interface AdminTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: { id: string; label: string; icon: string }[];
}

/**
 * AdminTabs Component
 * এডমিন প্যানেলের নেভিগেশন ট্যাবগুলো হ্যান্ডেল করে।
 * এটি মোবাইল ফ্রেন্ডলি এবং অনুভূমিকভাবে (horizontally) স্ক্রোলযোগ্য।
 */
const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all whitespace-nowrap border-2 ${
            activeTab === tab.id
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105 z-10'
              : 'bg-white text-slate-400 border-transparent hover:bg-slate-50 hover:border-slate-100 hover:text-slate-600'
          }`}
        >
          {/* আইকন রেন্ডারিং */}
          <span className="text-base leading-none">{tab.icon}</span>
          {/* লেবেল রেন্ডারিং */}
          <span className="leading-none">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// ডিফল্ট এক্সপোর্ট নিশ্চিত করা হয়েছে যাতে AdminPanel এ ইমপোর্ট করতে সমস্যা না হয়
export default AdminTabs;