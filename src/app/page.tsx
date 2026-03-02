"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";

interface Stats {
  teachers: number;
  classrooms: number;
  timeSlots: number;
  assignments: number;
  entries: number;
}

export default function HomePage(): React.JSX.Element {
  const [stats, setStats] = useState<Stats>({
    teachers: 0,
    classrooms: 0,
    timeSlots: 0,
    assignments: 0,
    entries: 0,
  });

  useEffect(() => {
    const snapshot = storageRepo.getSnapshot();
    setStats({
      teachers: snapshot.teachers.length,
      classrooms: snapshot.classrooms.length,
      timeSlots: snapshot.timeSlots.length,
      assignments: snapshot.assignments.length,
      entries: snapshot.scheduleEntries.length,
    });
  }, []);

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>Ringkasan Data</h2>
        <div className="three-col">
          <article className="panel">
            <strong>{stats.teachers}</strong>
            <p className="muted">Guru</p>
          </article>
          <article className="panel">
            <strong>{stats.classrooms}</strong>
            <p className="muted">Kelas</p>
          </article>
          <article className="panel">
            <strong>{stats.timeSlots}</strong>
            <p className="muted">Jam Pelajaran</p>
          </article>
          <article className="panel">
            <strong>{stats.assignments}</strong>
            <p className="muted">Penugasan</p>
          </article>
          <article className="panel">
            <strong>{stats.entries}</strong>
            <p className="muted">Entri Jadwal</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Urutan Pengisian</h2>
        <ol>
          <li>
            Isi data <Link href="/guru">Guru</Link>.
          </li>
          <li>
            Isi <Link href="/jam-pelajaran">Jam Pelajaran</Link>.
          </li>
          <li>
            Atur <Link href="/hari-belajar">Hari Belajar dan Slot Libur</Link>.
          </li>
          <li>
            Isi <Link href="/kelas">Kelas</Link>.
          </li>
          <li>
            Isi <Link href="/penugasan">Penugasan Guru-Mapel per Kelas</Link>.
          </li>
          <li>
            Susun <Link href="/jadwal">Jadwal Mingguan</Link>.
          </li>
        </ol>
      </section>
    </div>
  );
}
