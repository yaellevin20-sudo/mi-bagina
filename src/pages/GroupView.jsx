import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Share2, Copy, Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";
import ActiveBanner from "../components/ActiveBanner";
import PlaygroundCard from "../components/PlaygroundCard";
import SignalPresenceDialog from "../components/SignalPresenceDialog";
import { createPageUrl } from "../utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GroupView() {
  const [user, setUser] = useState(null);
  const [signalOpen, setSignalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("groupId");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const groups = await base44.entities.Group.filter({ id: groupId });
      return groups[0];
    },
    enabled: !!groupId,
  });

  const { data: visits = [], refetch: refetchVisits } = useQuery({
    queryKey: ["visits", groupId],
    queryFn: () => base44.entities.PlaygroundVisit.filter({ group_id: groupId }),
    enabled: !!groupId,
    refetchInterval: 30000,
  });

  // Active visits (< 60 min and not ended)
  const activeVisits = useMemo(() => {
    return visits.filter((v) => {
      const mins = moment().diff(moment(v.signal_time), "minutes");
      return mins < 60 && !v.ended;
    });
  }, [visits]);

  // Group by playground
  const playgrounds = useMemo(() => {
    const map = {};
    activeVisits.forEach((v) => {
      if (!map[v.playground_name]) map[v.playground_name] = [];
      map[v.playground_name].push(v);
    });
    // Sort by most recent
    return Object.entries(map).sort(([, a], [, b]) => {
      const latestA = Math.max(...a.map((v) => new Date(v.signal_time).getTime()));
      const latestB = Math.max(...b.map((v) => new Date(v.signal_time).getTime()));
      return latestB - latestA;
    });
  }, [activeVisits]);

  // My active visit
  const myActiveVisit = useMemo(() => {
    if (!user) return null;
    return activeVisits.find((v) => v.parent_email === user.email);
  }, [activeVisits, user]);

  // Recent playground names for autocomplete
  const recentPlaygrounds = useMemo(() => {
    const names = [...new Set(visits.map((v) => v.playground_name))];
    return names;
  }, [visits]);

  const handleEndVisit = async () => {
    if (myActiveVisit) {
      await base44.entities.PlaygroundVisit.update(myActiveVisit.id, { ended: true });
      refetchVisits();
    }
  };

  const handleChangePlayground = () => {
    setSignalOpen(true);
  };

  const handleSignaled = async () => {
    // End any existing active visit first
    if (myActiveVisit) {
      await base44.entities.PlaygroundVisit.update(myActiveVisit.id, { ended: true });
    }
    refetchVisits();
  };

  const handleLeaveGroup = async () => {
    const [memberships, phoneRecords] = await Promise.all([
      base44.entities.GroupMembership.filter({ group_id: groupId, user_email: user.email }),
      base44.entities.UserPhone.filter({ email: user.email, group_id: groupId }),
    ]);
    if (memberships.length > 0) {
      await base44.entities.GroupMembership.delete(memberships[0].id);
    }
    if (phoneRecords.length > 0) {
      await base44.entities.UserPhone.delete(phoneRecords[0].id);
    }
    window.location.href = createPageUrl("MyGroups");
  };

  const copyJoinLink = () => {
    if (group?.join_code) {
      const link = `${window.location.origin}${window.location.pathname}#/JoinGroup?code=${group.join_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!group || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Group header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-gray-400 mt-0.5">{group.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyJoinLink}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4 text-gray-500" />}
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4 text-red-500" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>עזיבת קבוצה</AlertDialogTitle>
                <AlertDialogDescription>
                  האם אתם בטוחים שברצונכם לעזוב את הקבוצה "{group.name}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeaveGroup}
                  className="bg-red-600 hover:bg-red-700"
                >
                  עזיבה
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* My active banner */}
      <ActiveBanner
        visit={myActiveVisit}
        onEnd={handleEndVisit}
        onChangePlayground={handleChangePlayground}
      />

      {/* Signal button */}
      {!myActiveVisit && (
        <Button
          onClick={() => setSignalOpen(true)}
          className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-base font-bold shadow-lg shadow-green-200"
        >
          <MapPin className="w-5 h-5 ml-2" />
          אנחנו בגינה! 🌳
        </Button>
      )}

      {/* Active playgrounds */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">
          {activeVisits.length > 0
            ? `${activeVisits.length} משפחות בגינות עכשיו`
            : "אין משפחות בגינות כרגע"}
        </h2>
        <div className="space-y-3">
          {playgrounds.map(([name, pgVisits]) => (
            <PlaygroundCard key={name} playgroundName={name} visits={pgVisits} />
          ))}
        </div>

        {activeVisits.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">🏕️</div>
            <p className="text-gray-500 text-sm">השכונה שקטה כרגע</p>
            <p className="text-gray-400 text-xs mt-1">היו הראשונים לדווח שאתם בגינה!</p>
          </div>
        )}
      </div>

      {/* Signal dialog */}
      <SignalPresenceDialog
        open={signalOpen}
        onOpenChange={setSignalOpen}
        groupId={groupId}
        user={user}
        onSignaled={handleSignaled}
        recentPlaygrounds={recentPlaygrounds}
      />
    </div>
  );
}