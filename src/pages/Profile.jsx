import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Check } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setName(u.full_name || "");
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.auth.updateMe({ full_name: name.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

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
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">אימייל</Label>
          <Input value={user.email} disabled className="rounded-xl bg-gray-50 text-gray-400" />
        </div>

        <Button
          onClick={handleSave}
          disabled={!name.trim() || saving || name === user.full_name}
          className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-base font-semibold"
        >
          {saved ? (
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> נשמר!</span>
          ) : saving ? "שומר..." : "שמירה"}
        </Button>
      </div>
    </div>
  );
}