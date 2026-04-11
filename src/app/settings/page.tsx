"use client";

import { storageRepo } from "@/lib/storage/repo";
import { isValidSnapshot } from "@/lib/validation/snapshot";
import { useState, useEffect } from "react";
import type { AISettings } from "@/types";

export default function SettingsPage(): React.JSX.Element {
  const [message, setMessage] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: "z-ai",
    baseUrl: "https://api.z.ai/api/paas/v4/chat/completions",
    model: "glm-5.1",
    apiKey: "",
  });

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value;
    if (provider === "z-ai") {
      setAiSettings({ ...aiSettings, provider, baseUrl: "https://api.z.ai/api/paas/v4/chat/completions", model: "glm-5.1" });
    } else if (provider === "sumopod") {
      setAiSettings({ ...aiSettings, provider, baseUrl: "https://ai.sumopod.com/v1/chat/completions", model: "gpt-5-mini" });
    } else {
      setAiSettings({ ...aiSettings, provider, baseUrl: "", model: "" });
    }
  };

  useEffect(() => {
    const saved = storageRepo.getAISettings();
    if (saved) {
      setAiSettings(saved);
    }
  }, []);

  const onExport = (): void => {
    const snapshot = storageRepo.getSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jadwal-backup-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Export JSON berhasil.");
  };

  const onImport = async (file: File): Promise<void> => {
    const text = await file.text();

    try {
      const parsed = JSON.parse(text) as unknown;
      if (!isValidSnapshot(parsed)) {
        setMessage("Import gagal: format JSON tidak valid.");
        return;
      }

      storageRepo.importSnapshot(parsed);
      setMessage("Import JSON berhasil. Refresh halaman untuk melihat semua perubahan.");
    } catch {
      setMessage("Import gagal: file bukan JSON valid.");
    }
  };

  const onSaveAiSettings = (e: React.FormEvent): void => {
    e.preventDefault();
    storageRepo.setAISettings(aiSettings);
    setMessage("Konfigurasi AI berhasil disimpan.");
    setTimeout(() => setMessage(""), 3000);
  };

  const onTestConnection = async (): Promise<void> => {
    if (!aiSettings.baseUrl || !aiSettings.apiKey) {
      setMessage("Harap isi Base URL dan API Key sebelum melakukan test.");
      return;
    }

    setIsTesting(true);
    setMessage("Sedang mengetes koneksi AI...");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: aiSettings.baseUrl,
          model: aiSettings.model,
          apiKey: aiSettings.apiKey,
          messages: [{ role: "user", content: "Reply 'OK' if you receive this." }],
        }),
      });

      if (!response.ok) {
        let errorText = "Unknown error";
        try {
          const errJson = await response.json() as { error?: string };
          errorText = errJson.error || await response.text();
        } catch {
          // ignore
        }
        throw new Error(`Proxy/Provider Error: ${errorText}`);
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid format from AI response");
      }

      setMessage("✅ Test berhasil! Koneksi API valid.");
    } catch (err: unknown) {
      setMessage(`❌ Test gagal: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTesting(false);
    }
  };

  const onResetData = (): void => {
    storageRepo.resetAllData();
    setConfirmReset(false);
    setMessage("✅ Semua data berhasil direset. Halaman akan di-refresh...");
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div className="page-grid">
      {/* ── Konfigurasi AI ──────────────────────────────────────── */}
      <section className="panel">
        <h2>Konfigurasi AI</h2>
        <form onSubmit={onSaveAiSettings} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
          <label>
            Provider AI
            <select
              value={aiSettings.provider || "custom"}
              onChange={handleProviderChange}
              style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #ccc", backgroundColor: "#fff" }}
            >
              <option value="z-ai">Z.ai</option>
              <option value="sumopod">Sumopod</option>
              <option value="custom">OpenAI Compatible (Custom)</option>
            </select>
          </label>
          <label>
            Base URL (Endpoint Chat Completions)
            <input
              type="url"
              required
              value={aiSettings.baseUrl}
              onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
              placeholder="https://api.z.ai/api/paas/v4/chat/completions"
              style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #ccc" }}
            />
          </label>
          <label>
            Model
            <input
              type="text"
              required
              value={aiSettings.model}
              onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
              placeholder="glm-5.1"
              style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #ccc" }}
            />
          </label>
          <label>
            API Key
            <input
              type="password"
              required
              value={aiSettings.apiKey}
              onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
              placeholder="sk-..."
              style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #ccc" }}
            />
          </label>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="submit" className="primary" disabled={isTesting}>
              Simpan Konfigurasi AI
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); void onTestConnection(); }}
              disabled={isTesting}
              style={{ padding: "8px 16px", borderRadius: 4, border: "1px solid #ccc", background: "#f8f9fa", cursor: "pointer", opacity: isTesting ? 0.6 : 1 }}
            >
              {isTesting ? "Mengetes..." : "Test Koneksi"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Backup dan Restore ──────────────────────────────────── */}
      <section className="panel">
        <h2>Backup dan Restore</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button className="primary" type="button" onClick={onExport}>
            Export JSON
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#f1f3f5", borderRadius: 4, cursor: "pointer" }}>
            Import JSON
            <input
              type="file"
              style={{ display: "none" }}
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void onImport(file);
                }
              }}
            />
          </label>
        </div>
        {message && <p className="badge warn" style={{ marginTop: 12 }}>{message}</p>}
        <p className="muted" style={{ marginTop: 12 }}>
          Catatan: data tersimpan di browser ini. Export JSON tidak akan menyertakan API Key AI Anda demi keamanan.
        </p>
      </section>

      {/* ── Danger Zone ─────────────────────────────────────────── */}
      <section
        className="panel"
        style={{
          border: "1.5px solid #f2c1bb",
          background: "linear-gradient(135deg, #fff8f7 0%, #fff 100%)",
        }}
      >
        <h2 style={{ color: "var(--danger)", marginBottom: 4 }}>⚠️ Danger Zone</h2>
        <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
          Tindakan di bawah ini <strong>tidak dapat dibatalkan</strong>.{" "}
          Semua data guru, kelas, jam, penugasan, dan jadwal akan dihapus permanen dari browser ini.
          Konfigurasi AI Anda akan tetap dipertahankan.
        </p>

        {!confirmReset ? (
          <button
            id="btn-reset-data"
            type="button"
            className="danger"
            style={{ fontWeight: 600, padding: "10px 20px" }}
            onClick={() => setConfirmReset(true)}
          >
            🗑️ Reset Semua Data
          </button>
        ) : (
          <div
            style={{
              background: "var(--danger-soft)",
              border: "1.5px solid #f2c1bb",
              borderRadius: 10,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxWidth: 460,
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, color: "var(--danger)" }}>
              Yakin ingin menghapus semua data?
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Guru, kelas, jam pelajaran, penugasan, dan seluruh jadwal akan dihapus.
              Tindakan ini <strong>permanen dan tidak bisa dikembalikan</strong>.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                id="btn-reset-confirm"
                type="button"
                className="danger"
                style={{ fontWeight: 700 }}
                onClick={onResetData}
              >
                Ya, hapus semuanya
              </button>
              <button
                id="btn-reset-cancel"
                type="button"
                onClick={() => setConfirmReset(false)}
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
