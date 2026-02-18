import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Plus, Users, Link2 } from "lucide-react";

export default function MyGroups() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", user?.email],
    queryFn: () => base44.entities.GroupMembership.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.list(),
    enabled: !!user,
  });

  const myGroups = groups.filter((g) =>
    memberships.some((m) => m.group_id === g.id)
  );

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
        <h1 className="text-2xl font-bold text-gray-900">הקבוצות שלי 👥</h1>
        <p className="text-sm text-gray-500 mt-1">כל הקבוצות שהצטרפתם אליהן</p>
      </div>

      <div className="flex gap-3">
        <Link to={createPageUrl("CreateGroup")} className="flex-1">
          <div className="bg-green-600 text-white rounded-2xl p-4 hover:bg-green-700 transition-colors text-center">
            <Plus className="w-5 h-5 mx-auto mb-1" />
            <p className="text-sm font-semibold">קבוצה חדשה</p>
          </div>
        </Link>
        <Link to={createPageUrl("JoinGroup")} className="flex-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors text-center">
            <Link2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-sm font-semibold text-gray-800">הצטרפות</p>
          </div>
        </Link>
      </div>

      <div className="space-y-3">
        {myGroups.map((group) => (
          <Link
            key={group.id}
            to={createPageUrl("GroupView") + `?groupId=${group.id}`}
            className="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{group.name}</p>
                  {group.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>
                  )}
                  <p className="text-[11px] text-gray-300 mt-0.5">קוד: {group.join_code}</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </div>
          </Link>
        ))}

        {myGroups.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">🏘️</div>
            <p className="text-gray-500 text-sm">אין לכם קבוצות עדיין</p>
            <p className="text-gray-400 text-xs mt-1">צרו או הצטרפו לקבוצה</p>
          </div>
        )}
      </div>
    </div>
  );
}