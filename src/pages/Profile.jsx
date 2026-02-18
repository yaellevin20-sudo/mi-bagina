import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Check } from "lucide-react";
import { useLocalUser } from "../components/useLocalUser";

export default function Profile() {
  const { user, updateUser } = useLocalUser();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) setName(user.full_name || "");
  }, [user]);

  const handleSave = () => {
    if (!name.trim()) return;
    updateUser({ full_name: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הפרופיל שלי 👤</h1>
        <p className="text-sm text-gray-500 mt-1">עדכנו את הפרטים האישיים שלכם</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <User className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">שם מלא</Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            placeholder="השם שיופיע לשכנים"
            className="rounded-xl"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">מספר טלפון</Label>
          <Input value={user.phone} disabled className="rounded-xl bg-gray-50 text-gray-400" dir="ltr" />
        </div>

        <Button
          onClick={handleSave}
          disabled={!name.trim() || name === user.full_name}
          className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-base font-semibold"
        >
          {saved ? (
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> נשמר!</span>
          ) : "שמירה"}
        </Button>
      </div>
    </div>
  );
}