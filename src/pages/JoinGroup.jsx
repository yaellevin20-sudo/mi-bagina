import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, CheckCircle, AlertCircle } from "lucide-react";

export default function JoinGroup() {
  const [user, setUser] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const preCode = params.get("code");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
    if (preCode) setCode(preCode);
  }, []);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const groups = await base44.entities.Group.filter({ join_code: code.trim().toUpperCase() });

    if (groups.length === 0) {
      setError("לא נמצאה קבוצה עם קוד זה");
      setLoading(false);
      return;
    }

    const group = groups[0];

    // Check if already a member
    const existing = await base44.entities.GroupMembership.filter({
      group_id: group.id,
      member_email: user.email,
    });

    if (existing.length > 0) {
      navigate(createPageUrl("GroupView") + `?groupId=${group.id}`);
      return;
    }

    await base44.entities.GroupMembership.create({
      group_id: group.id,
      member_email: user.email,
      user_name: user.full_name,
    });

    // Create a UserPhone record for this group so the WhatsApp agent can find the user by phone
    const userPhoneRecords = await base44.entities.UserPhone.filter({ email: user.email });
    const phone = userPhoneRecords.length > 0 ? userPhoneRecords[0].whatsapp_phone : (user.whatsapp_phone || "");
    await base44.entities.UserPhone.create({
      email: user.email,
      whatsapp_phone: phone,
      full_name: user.display_name || user.full_name || "",
      group_id: group.id,
    });

    setSuccess(true);
    setTimeout(() => {
      navigate(createPageUrl("GroupView") + `?groupId=${group.id}`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הצטרפות לקבוצה 🔗</h1>
        <p className="text-sm text-gray-500 mt-1">הכניסו את קוד ההצטרפות שקיבלתם</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
          <Link2 className="w-8 h-8 text-green-500" />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">קוד הצטרפות</Label>
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="הכניסו קוד..."
            className="rounded-xl text-center text-lg font-mono tracking-widest"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-xl">
            <CheckCircle className="w-4 h-4" />
            הצטרפתם בהצלחה! מעבירים אתכם...
          </div>
        )}

        <Button
          onClick={handleJoin}
          disabled={!code.trim() || loading || success}
          className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-base font-semibold"
        >
          {loading ? "מחפש..." : "הצטרפות"}
        </Button>
      </div>
    </div>
  );
}