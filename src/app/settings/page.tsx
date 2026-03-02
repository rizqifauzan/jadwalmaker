"use client";

import { storageRepo } from "@/lib/storage/repo";
import { isValidSnapshot } from "@/lib/validation/snapshot";
import { useState } from "react";

export default function SettingsPage(): React.JSX.Element {
  const [message, setMessage] = useState("");

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

  return (
    <section className="panel page-grid">
      <h2>Backup dan Restore</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="primary" type="button" onClick={onExport}>
          Export JSON
        </button>
        <label>
          Import JSON
          <input
            type="file"
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
      {message && <p className="badge warn">{message}</p>}
      <p className="muted">
        Catatan: data tersimpan di browser ini. Gunakan export berkala untuk backup.
      </p>
    </section>
  );
}
