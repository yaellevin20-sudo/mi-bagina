import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { Users, ChevronDown, MapPin, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";
import SignalPresenceDialog from "../components/SignalPresenceDialog";

export default function Home() {
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [signalOpen, setSignalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
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

  const { data: allVisits = [], refetch: refetchVisits } = useQuery({
    queryKey: ["allVisits"],
    queryFn: () => base44.entities.PlaygroundVisit.list("-signal_time", 200),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const myGroups = groups.filter((g) =>
    memberships.some((m) => m.group_id === g.id)
  );

  // Active visits per group (< 60 min, not ended)
  const activeVisitsByGroup = useMemo(() => {
    const map = {};
    allVisits.forEach((v) => {
      const mins = moment().diff(moment(v.signal_time), "minutes");
      if (mins < 60 && !v.ended) {
        if (!map[v.group_id]) map[v.group_id] = [];
        map[v.group_id].push(v);
      }
    });
    return map;
  }, [allVisits]);

  // Recent playground names per group
  const recentPlaygroundsByGroup = useMemo(() => {
    const map = {};
    allVisits.forEach((v) => {
      if (!map[v.group_id]) map[v.group_id] = new Set();
      map[v.group_id].add(v.playground_name);
    });
    const result = {};
    for (const [gid, names] of Object.entries(map)) {
      result[gid] = [...names];
    }
    return result;
  }, [allVisits]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSignalClick = (groupId) => {
    setSelectedGroupId(groupId);
    setSignalOpen(true);
  };

  const handleSignaled = async () => {
    refetchVisits();
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
      {/* Welcome */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">שלום, {user.full_name?.split(" ")[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">מי בגינה היום?</p>
      </div>

      {/* Add visit button */}
      <Button
        onClick={() => {
          if (myGroups.length === 1) {
            handleSignalClick(myGroups[0].id);
          } else if (myGroups.length > 1) {
            handleSignalClick(myGroups[0].id);
          }
        }}
        disabled={myGroups.length === 0}
        className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-base font-bold shadow-lg shadow-green-200"
      >
        <MapPin className="w-5 h-5 ml-2" />
        הוסיפו ביקור בגינה 🌳
      </Button>

      {/* My active groups */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">הקבוצות הפעילות שלי</h2>
        {myGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-gray-500 text-sm">אין לכם קבוצות עדיין</p>
            <p className="text-gray-400 text-xs mt-1">הצטרפו לקבוצה דרך התפריט</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myGroups.map((group) => {
              const groupVisits = activeVisitsByGroup[group.id] || [];
              const isExpanded = expandedGroups[group.id];
              const totalKids = groupVisits.reduce((sum, v) => sum + (v.children_names?.length || 0), 0);

              // Group visits by playground
              const byPlayground = {};
              groupVisits.forEach((v) => {
                if (!byPlayground[v.playground_name]) byPlayground[v.playground_name] = [];
                byPlayground[v.playground_name].push(v);
              });

              return (
                <div key={group.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{group.name}</p>
                      {totalKids > 0 ? (
                        <p className="text-xs text-green-600 mt-0.5 font-medium">
                          🌳 {totalKids} ילדים בגינות עכשיו
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">אין פעילות כרגע</p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-50">
                      {groupVisits.length === 0 ? (
                        <p className="text-sm text-gray-400 py-3 text-center">אין משפחות בגינות כרגע</p>
                      ) : (
                        <div className="space-y-3 pt-3">
                          {Object.entries(byPlayground).map(([pgName, pgVisits]) => (
                            <div key={pgName} className="bg-green-50 rounded-xl p-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <MapPin className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-sm font-semibold text-green-800">{pgName}</span>
                                <span className="text-xs text-green-600 mr-auto">
                                  {pgVisits.reduce((s, v) => s + (v.children_names?.length || 0), 0)} ילדים
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {pgVisits.map((v) => (
                                  <div key={v.id} className="flex items-center gap-2 text-xs text-gray-600">
                                    <Baby className="w-3 h-3 text-green-500" />
                                    <span className="font-medium">{v.parent_name}</span>
                                    {v.children_names?.length > 0 && (
                                      <span className="text-gray-400">— {v.children_names.join(", ")}</span>
                                    )}
                                    <span className="text-gray-300 mr-auto">
                                      {moment(v.signal_time).fromNow()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signal dialog */}
      {selectedGroupId && (
        <SignalPresenceDialog
          open={signalOpen}
          onOpenChange={setSignalOpen}
          groupId={selectedGroupId}
          user={user}
          onSignaled={handleSignaled}
          recentPlaygrounds={recentPlaygroundsByGroup[selectedGroupId] || []}
        />
      )}
    </div>
  );
}