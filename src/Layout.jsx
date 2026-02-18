import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Home, Users, Baby, LogOut, Menu, X, User } from "lucide-react";
import { useLocalUser } from "./components/useLocalUser";
import IdentitySetup from "./components/IdentitySetup";

export default function Layout({ children, currentPageName }) {
  const { user, saveUser, clearUser } = useLocalUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "הבית", page: "Home", icon: Home },
    { name: "הקבוצות שלי", page: "MyGroups", icon: Users },
    { name: "הילדים שלי", page: "ManageChildren", icon: Baby },
    { name: "הפרופיל שלי", page: "Profile", icon: User },
  ];

  // Loading
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Not registered yet
  if (user === null) {
    return <IdentitySetup onSave={saveUser} />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Rubik', sans-serif; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-green-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <span className="text-lg font-bold text-green-800">מי בגינה</span>
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl hover:bg-green-50 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5 text-green-700" /> : <Menu className="w-5 h-5 text-green-700" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-green-100 shadow-lg">
            <nav className="max-w-lg mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    currentPageName === item.page
                      ? "bg-green-100 text-green-800 font-medium"
                      : "text-gray-600 hover:bg-green-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <button
                onClick={() => { clearUser(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>יציאה (שינוי פרטים)</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Bottom nav for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-green-100 md:hidden">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
                currentPageName === item.page
                  ? "text-green-700"
                  : "text-gray-400"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {children}
      </main>
    </div>
  );
}