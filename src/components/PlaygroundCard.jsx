import React, { useState } from "react";
import { MapPin, Clock, ChevronDown, ChevronUp, Users } from "lucide-react";
import moment from "moment";

export default function PlaygroundCard({ playgroundName, visits }) {
  const [expanded, setExpanded] = useState(false);

  const activeVisits = visits.filter((v) => {
    const mins = moment().diff(moment(v.signal_time), "minutes");
    return mins < 60 && !v.ended;
  });

  if (activeVisits.length === 0) return null;

  const lastUpdate = activeVisits.reduce((latest, v) => {
    return moment(v.signal_time).isAfter(moment(latest)) ? v.signal_time : latest;
  }, activeVisits[0].signal_time);

  const minsAgo = moment().diff(moment(lastUpdate), "minutes");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{playgroundName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{activeVisits.length} משפחות</span>
              </div>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">לפני {minsAgo} דק׳</span>
              </div>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-50">
          {activeVisits.map((visit) => {
            const mins = moment().diff(moment(visit.signal_time), "minutes");
            const isExpiring = mins >= 45;
            return (
              <div
                key={visit.id}
                className={`p-3 rounded-xl border ${
                  isExpiring ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-900">{visit.parent_name}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isExpiring
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {isExpiring ? "⏳ עומד לפוג" : "🟢 פעיל"}
                  </span>
                </div>
                {visit.children_names && visit.children_names.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {visit.children_names.map((name, i) => (
                      <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-700">
                        {name}{visit.children_ages?.[i] ? ` (${visit.children_ages[i]})` : ""}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5">לפני {mins} דקות</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}