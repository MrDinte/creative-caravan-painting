"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { Product } from "@/lib/types";

export interface CartLine {
  product: Product;
  qty: number;
}

const STORAGE_KEY = "ccp_cart_v1";

/**
 * The cart lives in localStorage, which is an external system — so it's modelled
 * as an external store and read with useSyncExternalStore. This keeps the server
 * snapshot empty (avoiding hydration mismatch) while the client reads real data.
 */
const EMPTY: CartLine[] = [];

let cache: CartLine[] = EMPTY;
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cacheRaw) return cache; // stable identity between renders
    cacheRaw = raw;
    cache = raw ? (JSON.parse(raw) as CartLine[]) : EMPTY;
  } catch {
    cacheRaw = null;
    cache = EMPTY;
  }
  return cache;
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // storage full or disabled — fall back to in-memory only
  }
  cacheRaw = JSON.stringify(lines);
  cache = lines;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep multiple tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cacheRaw = null; // force re-read
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const serverSnapshot = () => EMPTY;

interface CartContextValue {
  lines: CartLine[];
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  totalCents: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, read, serverSnapshot);

  const add = useCallback((product: Product, qty = 1) => {
    const current = read();
    const existing = current.find((l) => l.product.id === product.id);
    write(
      existing
        ? current.map((l) =>
            l.product.id === product.id ? { ...l, qty: l.qty + qty } : l
          )
        : [...current, { product, qty }]
    );
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    const current = read();
    write(
      qty <= 0
        ? current.filter((l) => l.product.id !== productId)
        : current.map((l) => (l.product.id === productId ? { ...l, qty } : l))
    );
  }, []);

  const remove = useCallback((productId: string) => {
    write(read().filter((l) => l.product.id !== productId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo<CartContextValue>(() => {
    let count = 0;
    let totalCents = 0;
    for (const l of lines) {
      count += l.qty;
      totalCents += l.qty * l.product.priceCents;
    }
    return { lines, add, setQty, remove, clear, count, totalCents };
  }, [lines, add, setQty, remove, clear]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
