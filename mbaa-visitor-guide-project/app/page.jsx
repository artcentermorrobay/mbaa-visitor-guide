"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

const CATEGORIES = ["Eat", "Drink", "Shop", "Do", "Stay"];
const PARTICIPATION_TYPES = ["Free Listing", "Paid Ad", "Sponsorship", "Ad + Sponsorship"];
const AD_TIERS = ["Small", "Medium", "Premium"];
const SPONSOR_TIERS = ["Bronze", "Silver", "Gold", "Custom"];
const SHORT_DESC_LIMIT = 140;
const EXTENDED_DESC_LIMITS = { Small: 200, Medium: 340, Premium: 500 };

export default function SubmissionForm() {
  const [form, setForm] = useState({
    business_name: "", contact_name: "", email: "", phone: "",
    category: "", short_description: "", location: "", website: "", social: "",
    participation_type: "", ad_tier: "", extended_description: "", offer_text: "",
    sponsorship_tier: "", recognition_name: "", sponsor_notes: "",
    event_presence_interest: false, confirmed: false,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const set = (key) => (e) => {
    const val = e && e.target
      ? e.target.type === "checkbox" ? e.target.checked : e.target.value
      : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const showAd = form.participation_type === "Paid Ad" || form.participation_type === "Ad + Sponsorship";
  const showSponsor = form.participation_type === "Sponsorship" || form.participation_type === "Ad + Sponsorship";
  const extDescLimit = EXTENDED_DESC_LIMITS[form.ad_tier] || 340;

  function validate() {
    const e = {};
    ["business_name","contact_name","email","phone","short_description","location"].forEach(k => {
      if (!form[k].trim()) e[k] = true;
    });
    if (!form.category) e.category = true;
    if (!form.participation_type) e.participation_type = true;
    if (showAd && !form.ad_tier) e.ad_tier = true;
    if (showSponsor && !form.sponsorship_tier) e.sponsorship_tier = true;
    return e;
  }

  async function uploadFile(file, folder) {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { console.error("Upload error:", error); return null; }
    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
    return publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      let logo_url = null;
      let image_url = null;
      if (logoFile) logo_url = await uploadFile(logoFile, "logos");
      if (imageFile && showAd) image_url = await uploadFile(imageFile, "images");

      const record = {
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        category: form.category,
        short_description: form.short_description.trim(),
        location: form.location.trim(),
        website: form.website.trim() || null,
        social: form.social.trim() || null,
        participation_type: form.participation_type,
        ad_tier: showAd ? form.ad_tier : null,
        logo_url, image_url,
        extended_description: showAd ? form.extended_description.trim() : null,
        offer_text: showAd ? form.offer_text.trim() || null : null,
        sponsorship_tier: showSponsor ? form.sponsorship_tier : null,
        recognition_name: showSponsor ? form.recognition_name.trim() || null : null,
        sponsor_notes: showSponsor ? form.sponsor_notes.trim() || null : null,
        event_presence_interest: showSponsor ? form.event_presence_interest : false,
      };

      const { error } = await supabase.from("submissions").insert([record]);
      if (error) {
        console.error("Insert error:", error);
        setSubmitError("Something went wrong. Please try again or contact MBAA directly.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Something went wrong. Please try again or contact MBAA directly.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="form-wrapper">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="success-icon">✓</div>
          <h2 className="success-title">SUBMISSION RECEIVED</h2>
          <p className="success-text">
            Thank you for submitting your business information for the Morro Bay
            Visitor Guide. The MBAA team will review your entry and follow up if
            anything is needed.
          </p>
          <button onClick={() => window.location.reload()} className="btn-lime">
            Submit Another Business
          </button>
        </div>
        <style jsx>{`
          .form-wrapper { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
          .success-icon { width: 72px; height: 72px; border-radius: 50%; background-color: var(--lime); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; color: var(--lime-text); font-weight: 700; }
          .success-title { font-size: 24px; color: var(--coral); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .success-text { color: var(--gray-600); font-size: 14px; line-height: 1.7; max-width: 420px; margin: 0 auto 28px; }
          .btn-lime { padding: 12px 32px; background-color: var(--lime); color: var(--lime-text); border: none; border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div className="form-header-band">
          <h1 className="form-title">Morro Bay Visitor Guide</h1>
          <p className="form-subtitle-band">Art in the Park | Morro Bay Art Association</p>
        </div>
        <p className="form-subtitle">
          Submit your business for the Art in the Park Visitor Guide.
          <br />All local businesses receive a free listing at no cost.
        </p>
      </div>

      <div className="deadline-notice">
        <strong>Deadline:</strong> Submissions must be received by [INSERT DATE]
        to be included in the print edition. Online listings accepted on a rolling basis.
      </div>

      <form onSubmit={handleSubmit}>
        {/* Core Fields */}
        <div className="form-section section-aqua">
          <h3 className="section-title">Business Information</h3>
          <div className="field">
            <label className="field-label">Business Name <span className="req">*</span></label>
            <input type="text" value={form.business_name} onChange={set("business_name")}
              placeholder="As you'd like it to appear in the guide"
              className={`field-input ${errors.business_name ? "field-error" : ""}`} />
          </div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Contact Name <span className="req">*</span></label>
              <input type="text" value={form.contact_name} onChange={set("contact_name")}
                placeholder="Primary contact" className={`field-input ${errors.contact_name ? "field-error" : ""}`} />
            </div>
            <div className="field">
              <label className="field-label">Email <span className="req">*</span></label>
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="email@example.com" className={`field-input ${errors.email ? "field-error" : ""}`} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Phone <span className="req">*</span></label>
              <input type="tel" value={form.phone} onChange={set("phone")}
                placeholder="(805) 555-0000" className={`field-input ${errors.phone ? "field-error" : ""}`} />
            </div>
            <div className="field">
              <label className="field-label">Category <span className="req">*</span></label>
              <select value={form.category} onChange={set("category")}
                className={`field-input ${errors.category ? "field-error" : ""}`}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Short Description <span className="req">*</span></label>
            <textarea value={form.short_description} onChange={set("short_description")}
              placeholder="What does your business offer visitors?"
              maxLength={SHORT_DESC_LIMIT} rows={2}
              className={`field-input ${errors.short_description ? "field-error" : ""}`} />
            <div className="char-count">{form.short_description.length}/{SHORT_DESC_LIMIT}</div>
            <div className="field-hint">Brief description for the guide listing.</div>
          </div>
          <div className="field">
            <label className="field-label">Location <span className="req">*</span></label>
            <input type="text" value={form.location} onChange={set("location")}
              placeholder="Street address or neighborhood"
              className={`field-input ${errors.location ? "field-error" : ""}`} />
          </div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Website</label>
              <input type="text" value={form.website} onChange={set("website")}
                placeholder="yoursite.com" className="field-input" />
              <div className="field-hint">Optional</div>
            </div>
            <div className="field">
              <label className="field-label">Social</label>
              <input type="text" value={form.social} onChange={set("social")}
                placeholder="@handle" className="field-input" />
              <div className="field-hint">Optional</div>
            </div>
          </div>
        </div>

        {/* Participation Type */}
        <div className="form-section section-aqua">
          <h3 className="section-title">Participation Type</h3>
          <p className="section-desc">
            Every business gets a free text listing. Ad and sponsorship options
            provide additional visibility. All revenue supports MBAA's arts programs.
          </p>
          <div className="field">
            <label className="field-label">How would you like to participate? <span className="req">*</span></label>
            <select value={form.participation_type} onChange={set("participation_type")}
              className={`field-input ${errors.participation_type ? "field-error" : ""}`}>
              <option value="">Select participation type</option>
              {PARTICIPATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Paid Ad */}
        {showAd && (
          <div className="form-section section-coral">
            <h3 className="section-title">Paid Ad Details</h3>
            <p className="section-desc">
              Small: print only, business-card size. Medium: print and online,
              quarter-page. Premium: print and online, half-page with preferred placement.
            </p>
            <div className="field">
              <label className="field-label">Ad Tier <span className="req">*</span></label>
              <select value={form.ad_tier} onChange={set("ad_tier")}
                className={`field-input ${errors.ad_tier ? "field-error" : ""}`}>
                <option value="">Select ad tier</option>
                {AD_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Logo</label>
              <input type="file" accept="image/*"
                onChange={(e) => setLogoFile(e.target.files[0] || null)} className="field-file" />
              <div className="field-hint">PNG or vector preferred. High resolution.</div>
            </div>
            <div className="field">
              <label className="field-label">Image</label>
              <input type="file" accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0] || null)} className="field-file" />
              <div className="field-hint">Optional additional image for your ad.</div>
            </div>
            <div className="field">
              <label className="field-label">Extended Description</label>
              <textarea value={form.extended_description} onChange={set("extended_description")}
                placeholder="Tell visitors more about your business"
                maxLength={extDescLimit} rows={3} className="field-input" />
              <div className="char-count">{form.extended_description.length}/{extDescLimit}</div>
              <div className="field-hint">
                {form.ad_tier ? `Limit: ${extDescLimit} characters for ${form.ad_tier} tier.` : "Select a tier to see character limit."}
              </div>
            </div>
            <div className="field">
              <label className="field-label">Offer Text</label>
              <input type="text" value={form.offer_text} onChange={set("offer_text")}
                placeholder="e.g., 10% off with this guide" className="field-input" />
              <div className="field-hint">Optional. Special offer or coupon for guide readers.</div>
            </div>
          </div>
        )}

        {/* Sponsor */}
        {showSponsor && (
          <div className="form-section section-purple">
            <h3 className="section-title" style={{ color: "var(--purple)" }}>Sponsorship Details</h3>
            <p className="section-desc">
              Sponsorships provide broader recognition across the guide, event
              materials and MBAA communications. Custom packages are available.
            </p>
            <div className="field">
              <label className="field-label">Sponsorship Tier <span className="req">*</span></label>
              <select value={form.sponsorship_tier} onChange={set("sponsorship_tier")}
                className={`field-input ${errors.sponsorship_tier ? "field-error" : ""}`}>
                <option value="">Select sponsorship tier</option>
                {SPONSOR_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {!showAd && (
              <div className="field">
                <label className="field-label">Logo</label>
                <input type="file" accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0] || null)} className="field-file" />
                <div className="field-hint">PNG or vector preferred. High resolution.</div>
              </div>
            )}
            <div className="field">
              <label className="field-label">Recognition Name</label>
              <input type="text" value={form.recognition_name} onChange={set("recognition_name")}
                placeholder="e.g., The Smith Family Foundation" className="field-input" />
              <div className="field-hint">How you'd like to be recognized, if different from your business name.</div>
            </div>
            <div className="field">
              <label className="field-label">Notes</label>
              <textarea value={form.sponsor_notes} onChange={set("sponsor_notes")}
                placeholder="Custom arrangements, in-kind contributions, etc."
                rows={3} className="field-input" />
              <div className="field-hint">Anything else you'd like us to know about your sponsorship interests.</div>
            </div>
            <div className="field">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.event_presence_interest}
                  onChange={set("event_presence_interest")} className="checkbox-input" />
                Interested in event-day presence (banner, booth, etc.)
              </label>
            </div>
          </div>
        )}

        {/* Confirmation */}
        <div className="form-section">
          <label className="checkbox-label">
            <input type="checkbox" checked={form.confirmed}
              onChange={set("confirmed")} className="checkbox-input" />
            I confirm this information is accurate and I authorize MBAA to
            include my business in the Visitor Guide.
          </label>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="error-banner">Please fill in all required fields before submitting.</div>
        )}
        {submitError && <div className="error-banner">{submitError}</div>}

        <button type="submit" disabled={!form.confirmed || submitting} className="submit-btn"
          style={{
            backgroundColor: form.confirmed && !submitting ? "var(--lime)" : "var(--gray-200)",
            color: form.confirmed && !submitting ? "var(--lime-text)" : "var(--gray-400)",
            cursor: form.confirmed && !submitting ? "pointer" : "not-allowed",
          }}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      <style jsx>{`
        .form-wrapper { max-width: 600px; margin: 0 auto; padding: 32px 20px 60px; }
        .form-header-band { background-color: var(--aqua); padding: 28px 20px; border-radius: 10px; margin-bottom: 24px; }
        .form-title { font-size: 26px; color: var(--white); margin: 0; text-transform: uppercase; letter-spacing: 2px; }
        .form-subtitle-band { font-size: 13px; color: var(--white); margin-top: 8px; opacity: 0.9; }
        .form-subtitle { font-size: 14px; color: var(--gray-600); line-height: 1.7; }
        .deadline-notice { padding: 14px 18px; background-color: var(--coral-light); border-radius: 8px; border-left: 4px solid var(--coral); font-size: 13px; line-height: 1.6; color: var(--charcoal); margin-bottom: 28px; }
        .form-section { padding: 24px; background-color: var(--white); border-radius: 8px; border: 2px solid var(--gray-200); margin-bottom: 24px; }
        .section-aqua { border-color: var(--aqua); }
        .section-coral { border-color: var(--coral); }
        .section-purple { border-color: var(--purple); }
        .section-title { font-size: 18px; color: var(--coral); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .section-desc { font-size: 13px; color: var(--gray-600); margin-top: -12px; margin-bottom: 20px; line-height: 1.6; }
        .field { margin-bottom: 20px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field-label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; color: var(--gray-600); letter-spacing: 0.8px; text-transform: uppercase; }
        .req { color: var(--berry); margin-left: 3px; }
        .field-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--gray-200); border-radius: 6px; font-size: 14px; color: var(--charcoal); background-color: var(--white); transition: border-color 0.2s; }
        .field-input:focus { border-color: var(--aqua); outline: none; }
        .field-error { border-color: var(--red-fg) !important; }
        .field-hint { font-size: 12px; color: var(--gray-400); margin-top: 4px; }
        .char-count { font-size: 12px; color: var(--gray-400); text-align: right; margin-top: 4px; }
        .field-file { font-size: 13px; }
        .checkbox-label { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 14px; color: var(--charcoal); line-height: 1.5; }
        .checkbox-input { width: 18px; height: 18px; accent-color: var(--berry); cursor: pointer; flex-shrink: 0; margin-top: 3px; }
        .error-banner { padding: 12px 16px; background-color: var(--red-bg); border-radius: 6px; font-size: 13px; color: var(--red-fg); margin-bottom: 20px; line-height: 1.5; }
        .submit-btn { width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: 700; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.2s; margin-bottom: 40px; }
        @media (max-width: 500px) { .field-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
