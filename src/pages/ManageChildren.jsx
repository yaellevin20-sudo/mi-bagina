import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ManageChildren() {
  const [user, setUser] = useState(null);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", user?.email],
    queryFn: () => base44.entities.Child.filter({ parent_email: user.email }),
    enabled: !!user,
  });

  const handleAdd = async () => {
    if (!newName.trim() || !newAge) return;
    setAdding(true);
    await base44.entities.Child.create({
      name: newName.trim(),
      age: parseInt(newAge),
      parent_email: user.email,
    });
    setNewName("");
    setNewAge("");
    setAdding(false);
    queryClient.invalidateQueries({ queryKey: ["children"] });
  };

  const handleDelete = async (childId) => {
    await base44.entities.Child.delete(childId);
    queryClient.invalidateQueries({ queryKey: ["children"] });
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
        <h1 className="text-2xl font-bold text-gray-900">הילדים שלי 👶</h1>
        <p className="text-sm text-gray-500 mt-1">הוסיפו את הילדים שלכם כדי לדווח מי בגינה</p>
      </div>

      {/* Add child form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Plus className="w-4 h-4 text-green-600" />
          הוספת ילד/ה
        </h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <Label className="text-xs text-gray-500 mb-1 block">שם</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="שם הילד/ה"
              className="rounded-xl"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-gray-500 mb-1 block">גיל</Label>
            <Input
              type="number"
              value={newAge}
              onChange={(e) => setNewAge(e.target.value)}
              placeholder="גיל"
              min="0"
              max="18"
              className="rounded-xl"
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          disabled={!newName.trim() || !newAge || adding}
          className="w-full rounded-xl bg-green-600 hover:bg-green-700"
        >
          {adding ? "מוסיף..." : "הוספה"}
        </Button>
      </div>

      {/* Children list */}
      <div className="space-y-3">
        {children.map((child) => (
          <div
            key={child.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Baby className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{child.name}</p>
                <p className="text-xs text-gray-400">גיל {child.age}</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(child.id)}
              className="p-2 rounded-xl hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {!isLoading && children.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">👶</div>
            <p className="text-gray-500 text-sm">עדיין לא הוספתם ילדים</p>
          </div>
        )}
      </div>
    </div>
  );
}