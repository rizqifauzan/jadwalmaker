"use client";

import { useEffect, useRef, useState } from "react";
import type { Teacher } from "@/types";

interface TeacherComboboxProps {
  teachers: Teacher[];
  value: string; // teacherId
  onChange: (teacherId: string) => void;
  placeholder?: string;
  id?: string;
}

export function TeacherCombobox({
  teachers,
  value,
  onChange,
  placeholder = "Cari / pilih guru...",
  id,
}: TeacherComboboxProps): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedTeacher = teachers.find((t) => t.id === value) ?? null;

  // When closed, display name of selected teacher in input
  const displayValue = isOpen ? query : (selectedTeacher?.name ?? "");

  const filtered = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(query.toLowerCase()),
  );

  // Reset highlight when filtered changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const openDropdown = () => {
    setQuery("");
    setHighlightedIndex(0);
    setIsOpen(true);
    // Small delay to let state settle, then focus input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const selectTeacher = (teacher: Teacher) => {
    onChange(teacher.id);
    setIsOpen(false);
    setQuery("");
  };

  const clearSelection = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange("");
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const teacher = filtered[highlightedIndex];
      if (teacher) {
        selectTeacher(teacher);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  return (
    <div
      ref={containerRef}
      className="teacher-combobox"
      id={id}
    >
      {isOpen ? (
        <div className="teacher-combobox-search">
          <span className="teacher-combobox-search-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            ref={inputRef}
            className="teacher-combobox-input"
            type="text"
            value={query}
            placeholder="Ketik nama guru..."
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            autoComplete="off"
          />
        </div>
      ) : (
        <button
          type="button"
          className="teacher-combobox-trigger"
          onClick={openDropdown}
          aria-haspopup="listbox"
          aria-expanded={false}
        >
          {selectedTeacher ? (
            <span className="teacher-combobox-selected-name">{selectedTeacher.name}</span>
          ) : (
            <span className="teacher-combobox-placeholder">{placeholder}</span>
          )}
          <span className="teacher-combobox-actions">
            {selectedTeacher && (
              <span
                role="button"
                tabIndex={0}
                className="teacher-combobox-clear"
                aria-label="Hapus pilihan guru"
                onClick={clearSelection}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange("");
                  }
                }}
              >
                ×
              </span>
            )}
            <span className="teacher-combobox-chevron" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </button>
      )}

      {isOpen && (
        <ul
          ref={listRef}
          className="teacher-combobox-list"
          role="listbox"
          aria-label="Daftar guru"
        >
          {filtered.length === 0 ? (
            <li className="teacher-combobox-empty">Guru tidak ditemukan</li>
          ) : (
            filtered.map((teacher, i) => (
              <li
                key={teacher.id}
                role="option"
                aria-selected={teacher.id === value}
                className={[
                  "teacher-combobox-item",
                  teacher.id === value ? "teacher-combobox-item--selected" : "",
                  i === highlightedIndex ? "teacher-combobox-item--highlighted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  selectTeacher(teacher);
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                <span className="teacher-combobox-item-name">{teacher.name}</span>
                {teacher.id === value && (
                  <span className="teacher-combobox-item-check" aria-hidden="true">✓</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
