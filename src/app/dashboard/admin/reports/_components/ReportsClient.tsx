"use client";

import { useState, useTransition, useEffect } from "react";

const eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

interface ClubData {
  id: string;
  name: string;
  payPerVisit: number;
  contactEmail: string | null;
}

interface ResellerData {
  id: string;
  name: string;
  email: string;
  commissionRate: number;
}

interface ClubReportRow {
  clubId: string;
  name: string;
  visits: number;
  revenue: number;
  contactEmail: string | null;
}

interface ResellerReportRow {
  resellerId: string;
  name: string;
  salesCount: number;
  salesAmount: number;
  commission: number;
  email: string;
}

export default function ReportsClient({
  clubs,
  resellers,
}: {
  clubs: ClubData[];
  resellers: ResellerData[];
}) {
  const currentYear = new Date().getFullYear();
  const [clubQuarter, setClubQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [clubYear, setClubYear] = useState(currentYear);
  const [clubData, setClubData] = useState<ClubReportRow[]>([]);
  const [clubLoading, setClubLoading] = useState(false);

  const [resellerHalf, setResellerHalf] = useState(new Date().getMonth() < 6 ? 1 : 2);
  const [resellerYear, setResellerYear] = useState(currentYear);
  const [resellerData, setResellerData] = useState<ResellerReportRow[]>([]);
  const [resellerLoading, setResellerLoading] = useState(false);

  const [sendingClub, setSendingClub] = useState<string | null>(null);
  const [sendingAllClubs, setSendingAllClubs] = useState(false);
  const [sendingReseller, setSendingReseller] = useState<string | null>(null);
  const [sendingAllResellers, setSendingAllResellers] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadClubData() {
    setClubLoading(true);
    try {
      const res = await fetch(
        `/api/reports/clubs?quarter=${clubQuarter}&year=${clubYear}`
      );
      const data = await res.json();
      setClubData(data.clubs || []);
    } catch {
      setClubData([]);
    }
    setClubLoading(false);
  }

  async function loadResellerData() {
    setResellerLoading(true);
    try {
      const res = await fetch(
        `/api/reports/resellers?half=${resellerHalf}&year=${resellerYear}`
      );
      const data = await res.json();
      setResellerData(data.resellers || []);
    } catch {
      setResellerData([]);
    }
    setResellerLoading(false);
  }

  useEffect(() => {
    loadClubData();
  }, [clubQuarter, clubYear]);

  useEffect(() => {
    loadResellerData();
  }, [resellerHalf, resellerYear]);

  async function sendClubReport(clubId: string) {
    setSendingClub(clubId);
    setMessage(null);
    try {
      const res = await fetch("/api/reports/send-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, quarter: clubQuarter, year: clubYear }),
      });
      const data = await res.json();
      setMessage(data.error ? `Error: ${data.error}` : "Report sent successfully!");
    } catch {
      setMessage("Failed to send report");
    }
    setSendingClub(null);
  }

  async function sendAllClubReports() {
    setSendingAllClubs(true);
    setMessage(null);
    let sent = 0;
    let errors = 0;
    for (const club of clubData) {
      if (!club.contactEmail) { errors++; continue; }
      try {
        const res = await fetch("/api/reports/send-club", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clubId: club.clubId, quarter: clubQuarter, year: clubYear }),
        });
        const data = await res.json();
        if (data.error) errors++;
        else sent++;
      } catch {
        errors++;
      }
    }
    setMessage(`Sent ${sent} report(s)${errors > 0 ? `, ${errors} failed/skipped` : ""}.`);
    setSendingAllClubs(false);
  }

  async function sendResellerReport(resellerId: string) {
    setSendingReseller(resellerId);
    setMessage(null);
    try {
      const res = await fetch("/api/reports/send-reseller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resellerId, half: resellerHalf, year: resellerYear }),
      });
      const data = await res.json();
      setMessage(data.error ? `Error: ${data.error}` : "Report sent successfully!");
    } catch {
      setMessage("Failed to send report");
    }
    setSendingReseller(null);
  }

  async function sendAllResellerReports() {
    setSendingAllResellers(true);
    setMessage(null);
    let sent = 0;
    let errors = 0;
    for (const r of resellerData) {
      try {
        const res = await fetch("/api/reports/send-reseller", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resellerId: r.resellerId, half: resellerHalf, year: resellerYear }),
        });
        const data = await res.json();
        if (data.error) errors++;
        else sent++;
      } catch {
        errors++;
      }
    }
    setMessage(`Sent ${sent} report(s)${errors > 0 ? `, ${errors} failed` : ""}.`);
    setSendingAllResellers(false);
  }

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-10">
      {message && (
        <div className={`px-4 py-3 rounded-md text-sm font-medium ${
          message.startsWith("Error") || message.includes("failed")
            ? "bg-red-50 text-red-700"
            : "bg-green-50 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {/* Club Reports */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Club Reports</h2>
          <div className="flex items-center gap-3">
            <select
              value={clubQuarter}
              onChange={(e) => setClubQuarter(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value={1}>Q1 (Jan-Mar)</option>
              <option value={2}>Q2 (Apr-Jun)</option>
              <option value={3}>Q3 (Jul-Sep)</option>
              <option value={4}>Q4 (Oct-Dec)</option>
            </select>
            <select
              value={clubYear}
              onChange={(e) => setClubYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={sendAllClubReports}
              disabled={sendingAllClubs || clubData.length === 0}
              className="px-3 py-1.5 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {sendingAllClubs ? "Sending..." : "Send All Reports"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Club</th>
                <th className="px-4 py-3 font-medium">Contact Email</th>
                <th className="px-4 py-3 font-medium">Visits</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {clubLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Loading...</td>
                </tr>
              ) : clubData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No data for this period.</td>
                </tr>
              ) : (
                clubData.map((row) => (
                  <tr key={row.clubId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.contactEmail || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{row.visits}</td>
                    <td className="px-4 py-3 text-gray-600">{eur.format(row.revenue)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => sendClubReport(row.clubId)}
                        disabled={!row.contactEmail || sendingClub === row.clubId}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingClub === row.clubId ? "Sending..." : "Send Report"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reseller Reports */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Reseller Reports</h2>
          <div className="flex items-center gap-3">
            <select
              value={resellerHalf}
              onChange={(e) => setResellerHalf(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value={1}>H1 (Jan-Jun)</option>
              <option value={2}>H2 (Jul-Dec)</option>
            </select>
            <select
              value={resellerYear}
              onChange={(e) => setResellerYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={sendAllResellerReports}
              disabled={sendingAllResellers || resellerData.length === 0}
              className="px-3 py-1.5 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {sendingAllResellers ? "Sending..." : "Send All Reports"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Reseller</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Sales</th>
                <th className="px-4 py-3 font-medium">Sales Amount</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {resellerLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading...</td>
                </tr>
              ) : resellerData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No data for this period.</td>
                </tr>
              ) : (
                resellerData.map((row) => (
                  <tr key={row.resellerId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.email}</td>
                    <td className="px-4 py-3 text-gray-600">{row.salesCount}</td>
                    <td className="px-4 py-3 text-gray-600">{eur.format(row.salesAmount)}</td>
                    <td className="px-4 py-3 text-gray-600">{eur.format(row.commission)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => sendResellerReport(row.resellerId)}
                        disabled={sendingReseller === row.resellerId}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        {sendingReseller === row.resellerId ? "Sending..." : "Send Report"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
