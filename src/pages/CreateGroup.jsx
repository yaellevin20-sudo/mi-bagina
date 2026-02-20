import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateGroup() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const group = await base44.entities.Group.create({
      name: name.trim(),
      description: description.trim(),
      join_code: generateCode(),
    });

    // Auto-join the creator
    await base44.entities.GroupMembership.create({
      group_id: group.id,
      member_email: user.email,
      user_name: user.full_name,
    });

    navigate(createPageUrl("GroupView") + `?groupId=${group.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">קבוצה חדשה 🏘️</h1>
        <p className="text-sm text-gray-500 mt-1">צרו קבוצה לשכונה, גן ילדים, או חברים</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-green-500" />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">שם הקבוצה</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="למשל: שכונת הפרחים"
            className="rounded-xl"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">תיאור (אופציונלי)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תיאור קצר של הקבוצה..."
            className="rounded-xl resize-none h-20"
          />
        </div>

        <Button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-base font-semibold"
        >
          {loading ? "יוצר..." : "יצירת קבוצה"}
        </Button>
      </div>
    </div>
  );
}