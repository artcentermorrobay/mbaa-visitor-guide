"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["Eat", "Drink", "Shop", "Do", "Stay"];
const PARTICIPATION_TYPES = ["Free Listing", "Paid Ad", "Sponsorship", "Ad + Sponsorship"];
const STATUSES = ["Contacted", "Interested", "Form Received", "Content Ready", "Approved", "Payment Received", "Published", "Declined"];
const PAYMENT_STATUSES = ["N/A", "Invoiced", "Paid"];
const APPEARS_IN_OPTIONS = ["Print", "Online", "Both"];

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function exportCSV(data) {
  if (!data.length) return;
  const headers = ["Business Name","Contact Name","Email","Phone","Category","Short Description","Location","Website","Social","Participation Type","Ad Tier","Extended Description","Offer Text","Sponsorship Tier","Recognition Name","Sponsor Notes","Event Presence Interest","Status","Payment Status","Appears In","Volunteer Assigned","Admin Notes","Date Submitted"];
  const keys = ["business_name","contact_name","email","phone","category","short_description","location","website","social","participation_type","ad_tier","extended_description","offer_text","sponsorship_tier","recognition_name","sponsor_notes","event_presence_interest","status","payment_status","appears_in","volunteer_assigned","admin_notes","date_submitted"];
  const esc = (v) => { const s = v == null ? "" : String(v); return s.includes(",") || s.includes('"') || s.includes("\n") ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = [headers.join(",")];
  data.forEach((r) => rows.push(keys.map((k) => esc(r[k])).join(",")));
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "mbaa-visitor-guide-export.csv"; a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ value }) {
  const m = {
    Contacted: { bg: "#EEEEEE", fg: "#5A5A5A" },
    Interested: { bg: "#FFF3CD", fg: "#856404" },
    "Form Received": { bg: "#EDF7F7", fg: "#2A7A7A" },
    "Content Ready": { bg: "#D4EDDA", fg: "#276749" },
    Approved: { bg: "#D4EDDA", fg: "#276749" },
    "Payment Received": { bg: "#C8F0C8", fg: "#1A5C1A" },
    Published: { bg: "#C8F0C8", fg: "#1A5C1A" },
    Declined: { bg: "#F8E8E8", fg: "#C44A4A" },
  };
  const s = m[value] || { bg: "#EEEEEE", fg: "#5A5A5A" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, backgroundColor: s.bg, color: s.fg, whiteSpace: "nowrap" }}>
      {value}
    </span>
  );
}

function ParticipationBadge({ value }) {
  const m = {
    "Free Listing": { bg: "#EEEEEE", fg: "#5A5A5A" },
    "Paid Ad": { bg: "#FDF0E6", fg: "#A0603A" },
    Sponsorship: { bg: "#F0E0F0", fg: "#8B2E8B" },
    "Ad + Sponsorship": { bg: "#EDF7F7", fg: "#2A7A7A" },
  };
  const s = m[value] || { bg: "#EEEEEE", fg: "#5A5A5A" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, backgroundColor: s.bg, color: s.fg, whiteSpace: "nowrap" }}>
      {value}
    </span>
  );
}

function EditableCell({ value, onSave, type = "text", options }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  useEffect(() => { setDraft(value || ""); }, [value]);

  if (type === "select") {
    return (
      <select value={value || ""} onChange={(e) => onSave(e.target.value)}
        style={{ border: "none", backgroundColor: "transparent", fontSize: 12, cursor: "pointer", padding: "2px 0", color: "#2A2A2A", width: "100%" }}>
        {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} title="Click to edit"
        style={{ cursor: "pointer", minHeight: 20, fontSize: 12, padding: "2px 0", color: value ? "#2A2A2A" : "#9A9A9A", borderBottom: "1px dashed transparent" }}
        onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = "#D4D4D4"}
        onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = "transparent"}>
        {value || "---"}
      </div>
    );
  }

  return (
    <input autoFocus value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { onSave(draft); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { onSave(draft); setEditing(false); }
        if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
      }}
      style={{ width: "100%", fontSize: 12, padding: "3px 6px", border: "1.5px solid #7ECACA", borderRadius: 4, boxSizing: "border-box" }} />
  );
}

function DetailPanel({ record, onUpdate, onClose }) {
  if (!record) return null;
  const showAd = record.participation_type === "Paid Ad" || record.participation_type === "Ad + Sponsorship";
  const showSponsor = record.participation_type === "Sponsorship" || record.participation_type === "Ad + Sponsorship";

  const ST = ({ children, color }) => (
    <h4 style={{ fontSize: 13, fontWeight: 700, color: color || "#E8945A", marginBottom: 12, marginTop: 20, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", textTransform: "uppercase", letterSpacing: 0.8 }}>
      {children}
    </h4>
  );
  const Row = ({ label, children }) => (
    <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 700, color: "#9A9A9A", minWidth: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#2A2A2A", flex: 1 }}>{children}</span>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)", zIndex: 99 }} />
      <div style={{ position: "fixed", top: 0, right: 0, width: 440, height: "100vh", backgroundColor: "#FFFFFF", borderLeft: "3px solid #7ECACA", boxShadow: "-4px 0 20px rgba(0,0,0,0.08)", zIndex: 100, overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{record.business_name}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#9A9A9A", padding: "4px 8px" }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <ParticipationBadge value={record.participation_type} />
          <StatusBadge value={record.status} />
        </div>

        <ST>Contact</ST>
        <Row label="Contact">{record.contact_name}</Row>
        <Row label="Email">{record.email}</Row>
        <Row label="Phone">{record.phone}</Row>

        <ST>Listing</ST>
        <Row label="Category">{record.category}</Row>
        <Row label="Location">{record.location}</Row>
        <Row label="Website">{record.website || "---"}</Row>
        <Row label="Social">{record.social || "---"}</Row>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9A9A", marginBottom: 6 }}>Short Description</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, padding: "8px 12px", backgroundColor: "#EDF7F7", borderRadius: 6, marginBottom: 10 }}>
          <EditableCell value={record.short_description} onSave={(v) => onUpdate(record.id, "short_description", v)} />
        </div>

        {showAd && (
          <>
            <ST>Ad Details</ST>
            <Row label="Ad Tier">{record.ad_tier}</Row>
            {record.extended_description && <Row label="Ext. Desc">{record.extended_description}</Row>}
            {record.offer_text && <Row label="Offer">{record.offer_text}</Row>}
            <Row label="Logo">{record.logo_url ? <a href={record.logo_url} target="_blank" rel="noreferrer" style={{ color: "#7ECACA" }}>View file</a> : "Not uploaded"}</Row>
            <Row label="Image">{record.image_url ? <a href={record.image_url} target="_blank" rel="noreferrer" style={{ color: "#7ECACA" }}>View file</a> : "Not uploaded"}</Row>
          </>
        )}

        {showSponsor && (
          <>
            <ST color="#8B2E8B">Sponsorship</ST>
            <Row label="Tier">{record.sponsorship_tier}</Row>
            {record.recognition_name && <Row label="Recognition">{record.recognition_name}</Row>}
            {record.sponsor_notes && <Row label="Notes">{record.sponsor_notes}</Row>}
            <Row label="Event Pres.">{record.event_presence_interest ? "Yes" : "No"}</Row>
          </>
        )}

        <ST color="#7ECACA">Admin</ST>
        {[
          { l: "Status", f: "status", t: "select", o: STATUSES },
          { l: "Payment", f: "payment_status", t: "select", o: PAYMENT_STATUSES },
          { l: "Appears In", f: "appears_in", t: "select", o: APPEARS_IN_OPTIONS },
          { l: "Volunteer", f: "volunteer_assigned", t: "text" },
          { l: "Notes", f: "admin_notes", t: "text" },
        ].map((x) => (
          <div key={x.f} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9A9A", marginBottom: 4 }}>{x.l}</div>
            <EditableCell type={x.t} value={record[x.f]} options={x.o} onSave={(v) => onUpdate(record.id, x.f, v)} />
          </div>
        ))}
        <Row label="Submitted">{formatDate(record.date_submitted)}</Row>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ participation_type: "", status: "", category: "", appears_in: "" });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("submissions").select("*").order("date_submitted", { ascending: false });
    if (error) { console.error("Fetch error:", error); setData([]); }
    else { setData(rows || []); }
    setLoading(false);
  }

  const handleUpdate = useCallback(async (id, field, value) => {
    setData((d) => d.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    const { error } = await supabase.from("submissions").update({ [field]: value }).eq("id", id);
    if (error) { console.error("Update error:", error); fetchData(); }
  }, []);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filters.participation_type && r.participation_type !== filters.participation_type) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.appears_in && r.appears_in !== filters.appears_in) return false;
      if (search) {
        const s = search.toLowerCase();
        return (r.business_name || "").toLowerCase().includes(s) ||
          (r.contact_name || "").toLowerCase().includes(s) ||
          (r.email || "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [data, filters, search]);

  const selected = data.find((r) => r.id === selectedId) || null;
  const counts = useMemo(() => ({
    total: data.length,
    free: data.filter((r) => r.participation_type === "Free Listing").length,
    ad: data.filter((r) => r.participation_type === "Paid Ad" || r.participation_type === "Ad + Sponsorship").length,
    sponsor: data.filter((r) => r.participation_type === "Sponsorship" || r.participation_type === "Ad + Sponsorship").length,
    paid: data.filter((r) => r.payment_status === "Paid").length,
  }), [data]);

  const hasFilters = filters.participation_type || filters.status || filters.category || filters.appears_in || search;
  const clearFilters = () => { setFilters({ participation_type: "", status: "", category: "", appears_in: "" }); setSearch(""); };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1400, margin: "0 auto", backgroundColor: "#FAFAFA", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: "#E8945A", textTransform: "uppercase", letterSpacing: 1 }}>Visitor Guide Admin</h1>
          <p style={{ fontSize: 12, color: "#9A9A9A", marginTop: 4 }}>Morro Bay Art Association</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={fetchData} style={{ padding: "10px 20px", backgroundColor: "transparent", border: "1.5px solid #D4D4D4", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#5A5A5A" }}>Refresh</button>
          <button onClick={() => exportCSV(filtered)} style={{ padding: "10px 24px", backgroundColor: "#B5367A", color: "#FFFFFF", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}>Export CSV ({filtered.length})</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { l: "Total", v: counts.total, c: "#7ECACA" },
          { l: "Free Listings", v: counts.free, c: "#5A5A5A" },
          { l: "Paid Ads", v: counts.ad, c: "#E8945A" },
          { l: "Sponsors", v: counts.sponsor, c: "#8B2E8B" },
          { l: "Payments In", v: counts.paid, c: "#A8BC2E" },
        ].map((x) => (
          <div key={x.l} style={{ padding: "14px 16px", backgroundColor: "#FFFFFF", borderRadius: 8, border: "1.5px solid #D4D4D4", borderTop: `3px solid ${x.c}` }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: x.c, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{x.v}</div>
            <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end", padding: "14px 18px", backgroundColor: "#EDF7F7", borderRadius: 8, border: "1.5px solid #D4EDED" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#5A5A5A", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Search</div>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Business, contact, email..."
            style={{ width: "100%", padding: "6px 10px", border: "1.5px solid #D4D4D4", borderRadius: 5, fontSize: 12, boxSizing: "border-box", backgroundColor: "#FFFFFF" }} />
        </div>
        {[
          { l: "Type", k: "participation_type", o: PARTICIPATION_TYPES },
          { l: "Status", k: "status", o: STATUSES },
          { l: "Category", k: "category", o: CATEGORIES },
          { l: "Appears In", k: "appears_in", o: APPEARS_IN_OPTIONS },
        ].map((f) => (
          <div key={f.k}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#5A5A5A", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{f.l}</div>
            <select value={filters[f.k]} onChange={setFilter(f.k)}
              style={{ padding: "6px 8px", border: "1.5px solid #D4D4D4", borderRadius: 5, fontSize: 12, backgroundColor: "#FFFFFF", cursor: "pointer", minWidth: 120 }}>
              <option value="">All</option>
              {f.o.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {hasFilters && (
          <button onClick={clearFilters} style={{ padding: "6px 14px", backgroundColor: "#FFFFFF", border: "1.5px solid #D4D4D4", borderRadius: 5, fontSize: 11, cursor: "pointer", color: "#5A5A5A" }}>Clear</button>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#9A9A9A", fontSize: 14 }}>Loading submissions...</div>}

      {!loading && (
        <div style={{ borderRadius: 8, border: "1.5px solid #D4D4D4", overflow: "hidden", marginBottom: 40 }}>
          <div style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  {["Business", "Category", "Type", "Status", "Payment", "Appears In", "Volunteer", "Submitted"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "2px solid #7ECACA", backgroundColor: "#EDF7F7", position: "sticky", top: 0, zIndex: 2 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "#9A9A9A", padding: 40, fontSize: 14, borderBottom: "1px solid #EEEEEE" }}>No submissions match your filters.</td></tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)}
                    style={{ cursor: "pointer", backgroundColor: selectedId === r.id ? "#EDF7F7" : "transparent", transition: "background-color 0.15s" }}
                    onMouseEnter={(e) => { if (selectedId !== r.id) e.currentTarget.style.backgroundColor = "#F8F8F8"; }}
                    onMouseLeave={(e) => { if (selectedId !== r.id) e.currentTarget.style.backgroundColor = "transparent"; }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, borderBottom: "1px solid #EEEEEE" }}>
                      <div style={{ fontWeight: 700, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{r.business_name}</div>
                      <div style={{ fontSize: 11, color: "#9A9A9A", marginTop: 2 }}>{r.contact_name}</div>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #EEEEEE" }}>{r.category}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #EEEEEE" }}><ParticipationBadge value={r.participation_type} /></td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #EEEEEE" }} onClick={(e) => e.stopPropagation()}>
                      <EditableCell type="select" value={r.status} options={STATUSES} onSave={(v) => handleUpdate(r.id, "status", v)} />
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #EEEEEE" }} onClick={(e) => e.stopPropagation()}>
                      <EditableCell type="select" value={r.payment_status} options={PAYMENT_STATUSES} onSave={(v) => handleUpdate(r.id, "payment_status", v)} />
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #EEEEEE" }} onClick={(e) => e.stopPropagation()}>
                      <EditableCell type="select" value={r.appears_in} options={APPEARS_IN_OPTIONS} onSave={(v) => handleUpdate(r.id, "appears_in", v)} />
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #EEEEEE" }} onClick={(e) => e.stopPropagation()}>
                      <EditableCell value={r.volunteer_assigned} onSave={(v) => handleUpdate(r.id, "volunteer_assigned", v)} />
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: "#9A9A9A", borderBottom: "1px solid #EEEEEE", whiteSpace: "nowrap" }}>{formatDate(r.date_submitted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <DetailPanel record={selected} onUpdate={handleUpdate} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
