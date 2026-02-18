import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SignalPresenceDialog({ open, onOpenChange, groupId, user, onSignaled, recentPlaygrounds }) {
  const [children, setChildren] = useState([]);
  const [playgroundName, setPlaygroundName] = useState("");
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (open && user) {
      base44.entities.Child.filter({ parent_email: user.email }).then((res) => {
        setChildren(res);
        setSelectedChildren(res.map((c) => c.id));
      });
    }
  }, [open, user]);

  const toggleChild = (childId) => {
    setSelectedChildren((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const filteredSuggestions = recentPlaygrounds?.filter((p) =>
    p.toLowerCase().includes(playgroundName.toLowerCase()) && playgroundName.length > 0
  ) || [];

  const handleSignal = async () => {
    if (!playgroundName.trim()) return;
    setLoading(true);

    const selectedChildData = children.filter((c) => selectedChildren.includes(c.id));

    await base44.entities.PlaygroundVisit.create({
      group_id: groupId,
      parent_email: user.email,
      parent_name: user.full_name,
      playground_name: playgroundName.trim(),
      children_names: selectedChildData.map((c) => c.name),
      children_ages: selectedChildData.map((c) => c.age),
      signal_time: new Date().toISOString(),
      ended: false,
    });

    setLoading(false);
    setPlaygroundName("");
    onOpenChange(false);
    onSignaled?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            אנחנו בגינה!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Playground name */}
          <div className="relative">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">שם הגינה</Label>
            <Input
              value={playgroundName}
              onChange={(e) => {
                setPlaygroundName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="למשל: גן השקד, הגינה הגדולה..."
              className="rounded-xl"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {filteredSuggestions.slice(0, 5).map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setPlaygroundName(name);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-green-50 transition-colors text-sm"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Children selection */}
          {children.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">מי איתכם?</Label>
              <div className="space-y-2">
                {children.map((child) => (
                  <label
                    key={child.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedChildren.includes(child.id)
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedChildren.includes(child.id)}
                      onCheckedChange={() => toggleChild(child.id)}
                    />
                    <div>
                      <span className="font-medium text-sm">{child.name}</span>
                      <span className="text-xs text-gray-400 mr-2">גיל {child.age}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {children.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              לא נמצאו ילדים. הוסיפו ילדים דרך "הילדים שלי" 👶
            </p>
          )}

          <Button
            onClick={handleSignal}
            disabled={!playgroundName.trim() || loading}
            className="w-full rounded-xl h-12 bg-green-600 hover:bg-green-700 text-base font-semibold"
          >
            {loading ? "שולח..." : "✓ אנחנו בגינה!"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}