import { create } from 'zustand';
import type { ReactNode } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

export interface ContextMenuDivider {
  type: 'divider';
}

export interface ContextMenuLabel {
  type: 'label';
  label: string;
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuDivider | ContextMenuLabel;

interface OpenMenuOptions {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  width?: number;
}

interface ContextMenuStore {
  menu: OpenMenuOptions | null;
  open: (opts: OpenMenuOptions) => void;
  close: () => void;
}

export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  menu: null,
  open: (menu) => set({ menu }),
  close: () => set({ menu: null }),
}));
