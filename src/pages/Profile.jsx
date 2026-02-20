import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [originalName, setOriginalName] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      const n = u.display_name || u.full_name || "";
      const p = u.whatsapp_phone || "";
      setName(n);
      setWhatsappPhone(p);
      setOriginalName(n);
      setOriginalPhone(p);
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const hasChanges = useMemo(() => {
    return name !== originalName || whatsappPhone !== originalPhone;
  }, [name, whatsappPhone, originalName, originalPhone]);

  // Intercept navigation away when there are unsaved changes
  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handleClick = (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
      setShowUnsavedDialog(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [hasChanges]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const normalizedPhone = normalizeIsraeliPhone(whatsappPhone.trim());
    await base44.auth.updateMe({ display_name: name.trim(), whatsapp_phone: normalizedPhone });
    setUser((prev) => ({ ...prev, display_name: name.trim(), whatsapp_phone: normalizedPhone }));
    setOriginalName(name.trim());
    setOriginalPhone(whatsappPhone);

    // Sync UserPhone records (one per group) so the WhatsApp agent can look up this user by phone.
    // The frontend can query GroupMembership; the agent cannot (it's user-scoped).
    const [memberships, existingPhoneRecords] = await Promise.all([
      base44.entities.GroupMembership.filter({ user_email: user.email }),
      base44.entities.UserPhone.filter({ email: user.email }),
    ]);

    if (memberships.length > 0) {
      const membershipGroupIds = new Set(memberships.map((m) => m.group_id));
      for (const membership of memberships) {
        const existing = existingPhoneRecords.find((r) => r.group_id === membership.group_id);
        if (existing) {
          await base44.entities.UserPhone.update(existing.id, { whatsapp_phone: normalizedPhone, full_name: name.trim() });
        } else {
          await base44.entities.UserPhone.create({ email: user.email, whatsapp_phone: normalizedPhone, full_name: name.trim(), group_id: membership.group_id });
        }
      }
      // Remove stale records (left groups or old no-group placeholder)
      for (const r of existingPhoneRecords) {
        if (!r.group_id || !membershipGroupIds.has(r.group_id)) {
          await base44.entities.UserPhone.delete(r.id);
        }
      }
    } else {
      // Not in any groups yet — upsert a single placeholder so the agent knows the phone is registered
      if (existingPhoneRecords.length > 0) {
        await base44.entities.UserPhone.update(existingPhoneRecords[0].id, { whatsapp_phone: normalizedPhone, full_name: name.trim() });
      } else {
        await base44.entities.UserPhone.create({ email: user.email, whatsapp_phone: normalizedPhone, full_name: name.trim(), group_id: "" });
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAndNavigate = async () => {
    await handleSave();
    if (pendingNavigation) window.location.href = pendingNavigation;
  };

  const handleDiscardAndNavigate = () => {
    if (pendingNavigation) window.location.href = pendingNavigation;
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
          disabled={!name.trim() || saving || !hasChanges}
          className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-base font-semibold"
        >
          {saved ? (
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> נשמר!</span>
          ) : saving ? "שומר..." : "שמירה"}
        </Button>
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent dir="rtl" className="max-w-[calc(100vw-2rem)] w-full rounded-2xl p-4">
          <button
            onClick={() => { setShowUnsavedDialog(false); setPendingNavigation(null); }}
            className="absolute left-3 top-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">שינויים שלא נשמרו</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              יש לכם שינויים שלא נשמרו. מה תרצו לעשות?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 mt-2">
            <AlertDialogAction onClick={handleDiscardAndNavigate} className="bg-red-600 hover:bg-red-700 text-sm h-10">
              יציאה בלי לשמור
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndNavigate} className="bg-green-600 hover:bg-green-700 text-sm h-10">
              שמירה ויציאה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}