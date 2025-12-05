"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./site_editor.module.css";

export default function SiteEditorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });
  
  const [activeTab, setActiveTab] = useState("about");

  const [formData, setFormData] = useState({
    about: { mission: "", vision: "", history: "" },
    impact: { mainTitle: "", mainDescription: "" },
    donate: { gcashNumber: "", bankDetails: "", otherDetails: "" },
    footer: { description: "", email: "", phone: "", address: "" },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/public-content");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            about: data.about || { mission: "", vision: "", history: "" },
            impact: data.impact || { mainTitle: "", mainDescription: "" },
            donate: data.donate || { gcashNumber: "", bankDetails: "", otherDetails: "" },
            footer: data.footer || { description: "", email: "", phone: "", address: "" }
          });
        }
      } catch (error) {
        console.error("Failed to load content", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: null, message: "" }); 

    try {
      const res = await fetch("/api/public-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setStatus({ type: 'success', message: "✓ Changes saved successfully!" });
      router.refresh();

      setTimeout(() => {
        setStatus({ type: null, message: "" });
      }, 3000);

    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: "⚠️ Error saving data. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const updateNested = (section: string, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  if (loading) return <div style={{ padding: 20 }}>Loading editor content...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
          <h1 className={styles.title}>Public Site Editor</h1>
      </div>

      <div className={styles.card}>
        
        {/* Navigation Tabs */}
        <div className={styles.tabsContainer}>
            {['about', 'impact', 'donate', 'footer'].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
            ))}
        </div>

        <form onSubmit={handleSave}>
            
            {/* --- ABOUT TAB --- */}
            {activeTab === 'about' && (
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>About Page Settings</h2>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Our Mission</label>
                    <textarea className={styles.textarea} rows={4} value={formData.about.mission} onChange={(e) => updateNested('about', 'mission', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Our Vision</label>
                    <textarea className={styles.textarea} rows={4} value={formData.about.vision} onChange={(e) => updateNested('about', 'vision', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Our History</label>
                    <textarea className={styles.textarea} rows={6} value={formData.about.history} onChange={(e) => updateNested('about', 'history', e.target.value)} />
                </div>
            </div>
            )}

            {/* --- IMPACT TAB --- */}
            {activeTab === 'impact' && (
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>What We Do (Header)</h2>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Main Title</label>
                    <input className={styles.input} value={formData.impact.mainTitle} onChange={(e) => updateNested('impact', 'mainTitle', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Main Description</label>
                    <textarea className={styles.textarea} rows={3} value={formData.impact.mainDescription} onChange={(e) => updateNested('impact', 'mainDescription', e.target.value)} />
                </div>
                <p className={styles.helpText}>Note: Manage the actual programs list via the "Programs" tab in the sidebar.</p>
            </div>
            )}

            {/* --- DONATE TAB --- */}
            {activeTab === 'donate' && (
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Donation Page Settings</h2>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>GCash Number</label>
                    <input className={styles.input} value={formData.donate.gcashNumber} onChange={(e) => updateNested('donate', 'gcashNumber', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Bank Transfer Instructions</label>
                    <textarea className={styles.textarea} rows={5} value={formData.donate.bankDetails} onChange={(e) => updateNested('donate', 'bankDetails', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Other Options</label>
                    <textarea className={styles.textarea} rows={3} value={formData.donate.otherDetails} onChange={(e) => updateNested('donate', 'otherDetails', e.target.value)} />
                </div>
            </div>
            )}

            {/* --- FOOTER TAB --- */}
            {activeTab === 'footer' && (
            <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Footer Content</h2>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Organization Description</label>
                    <textarea className={styles.textarea} rows={3} value={formData.footer.description} onChange={(e) => updateNested('footer', 'description', e.target.value)} />
                    <p className={styles.helpText}>Appears under the logo/title in the footer.</p>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input className={styles.input} value={formData.footer.email} onChange={(e) => updateNested('footer', 'email', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Phone Number</label>
                    <input className={styles.input} value={formData.footer.phone} onChange={(e) => updateNested('footer', 'phone', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Physical Address</label>
                    <input className={styles.input} value={formData.footer.address} onChange={(e) => updateNested('footer', 'address', e.target.value)} />
                </div>
            </div>
            )}

            {/* --- ACTION BUTTON & MESSAGES --- */}
            <div className={styles.buttonGroup}>
                <button type="submit" disabled={saving} className={styles.saveButton}>
                    {saving ? "Saving..." : "Save All Changes"}
                </button>

                {/* Success Message */}
                {status.type === 'success' && (
                    <div className={styles.successMessage}>
                        {status.message}
                    </div>
                )}

                {/* Error Message */}
                {status.type === 'error' && (
                    <div className={styles.errorMessage}>
                        {status.message}
                    </div>
                )}
            </div>
        </form>
      </div>
    </div>
  );
}