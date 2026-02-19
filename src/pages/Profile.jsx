import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Check } from "lucide-react";

function normalizeIsraeliPhone(raw) {
  if (!raw) return raw;
  let digits = raw.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("972") && digits.length >= 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "972" + digits.slice(1);
  return digits; // unrecognized — pass through
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setName(u.display_name || u.full_name || "");
      setWhatsappPhone(u.whatsapp_phone || "");
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const normalizedPhone = normalizeIsraeliPhone(whatsappPhone.trim());
    await base44.auth.updateMe({ display_name: name.trim(), whatsapp_phone: normalizedPhone });
    setUser((prev) => ({ ...prev, display_name: name.trim(), whatsapp_phone: normalizedPhone }));
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

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">מספר וואטסאפ</Label>
          <Input
            value={whatsappPhone}
            onChange={(e) => { setWhatsappPhone(e.target.value); setSaved(false); }}
            placeholder="למשל: 0541234567"
            className="rounded-xl"
            dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">המספר שמחובר לוואטסאפ שלכם – כדי לקבל עדכוני גינה</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!name.trim() || saving || (name === (user.display_name || user.full_name || "") && whatsappPhone === (user.whatsapp_phone || ""))}
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