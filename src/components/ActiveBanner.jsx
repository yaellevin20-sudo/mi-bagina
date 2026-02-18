import React from "react";
import { MapPin, Clock, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

export default function ActiveBanner({ visit, onEnd, onChangePlayground }) {
  if (!visit) return null;

  const minutesAgo = moment().diff(moment(visit.signal_time), "minutes");
  const isExpiring = minutesAgo >= 45;

  return (
    <div className={`rounded-2xl p-4 mb-6 border ${
      isExpiring
        ? "bg-amber-50 border-amber-200"
        : "bg-green-50 border-green-200"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isExpiring ? "bg-amber-100" : "bg-green-100"
          }`}>
            <MapPin className={`w-5 h-5 ${isExpiring ? "text-amber-600" : "text-green-600"}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${isExpiring ? "text-amber-800" : "text-green-800"}`}>
              {isExpiring ? "⏳ הביקור עומד לפוג" : "אתם עכשיו ב:"}
            </p>
            <p className={`text-base font-bold truncate ${isExpiring ? "text-amber-900" : "text-green-900"}`}>
              {visit.playground_name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">לפני {minutesAgo} דקות</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onChangePlayground}
          className="flex-1 rounded-xl text-xs h-9"
        >
          <RefreshCw className="w-3.5 h-3.5 ml-1" />
          שינוי גינה
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEnd}
          className="flex-1 rounded-xl text-xs h-9 border-red-200 text-red-600 hover:bg-red-50"
        >
          <X className="w-3.5 h-3.5 ml-1" />
          סיום ביקור
        </Button>
      </div>
    </div>
  );
}