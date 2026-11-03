import { useEffect, useState } from "react";
import { api, type Place } from "./types";
import s from "./App.module.css";
export function PlaceSearch({
  label,
  onSelect,
}: {
  label: string;
  onSelect: (p: Place | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Place[]>([]);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const [chosen, setChosen] = useState(false);
  useEffect(() => {
    if (query.length < 3 || chosen) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<{ places: Place[] }>("/api/places?q=" + encodeURIComponent(query), {
        signal: controller.signal,
      })
        .then((d) => {
          setItems(d.places);
          setError(d.places.length ? "" : "No locations found.");
        })
        .catch((e: Error) => {
          if (e.name !== "AbortError") setError(e.message);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, chosen]);
  function choose(p: Place) {
    setQuery(p.label);
    onSelect(p);
    setItems([]);
    setChosen(true);
    setActive(-1);
    setError("");
  }
  const id = label.toLowerCase();
  return (
    <div className={s.search}>
      <label htmlFor={id}>
        {label}
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={items.length > 0}
          aria-controls={id + "-list"}
          aria-activedescendant={active >= 0 ? id + "-" + active : undefined}
          autoComplete="off"
          required
          value={query}
          placeholder={
            label === "Origin"
              ? "Find a US departure point"
              : "Find a US destination"
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setChosen(false);
            onSelect(null);
            setError("");
            setItems([]);
            setActive(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, items.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === "Enter" && active >= 0 && items[active]) {
              e.preventDefault();
              choose(items[active]);
            }
            if (e.key === "Escape") setItems([]);
          }}
        />
      </label>
      <ul
        id={id + "-list"}
        role="listbox"
        aria-label={label + " suggestions"}
        className={items.length ? s.suggestions : s.hidden}
      >
        {items.map((p, i) => (
          <li
            id={id + "-" + i}
            role="option"
            aria-selected={i === active}
            key={p.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(p)}
          >
            {p.label}
          </li>
        ))}
      </ul>
      {error && <small role="status">{error}</small>}
    </div>
  );
}
