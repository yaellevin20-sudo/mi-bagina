import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function IdentitySetup({ onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSave(name, phone);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🌳</div>
          <h1 className="text-2xl font-bold text-gray-900">מי בגינה</h1>
          <p className="text-gray-500 mt-2 text-sm">הכניסו פרטים פעם אחת ותמיד תהיו מחוברים</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">השם שלכם</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: רונית כהן"
              className="rounded-xl h-12 text-base"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">מספר טלפון</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
              type="tel"
              className="rounded-xl h-12 text-base"
              dir="ltr"
            />
          </div>
          <Button
            type="submit"
            disabled={!name.trim() || !phone.trim()}
            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-base font-semibold"
          >
            כניסה לאפליקציה 🌿
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400">
          הפרטים נשמרים רק במכשיר שלכם
        </p>
      </div>
    </div>
  );
}