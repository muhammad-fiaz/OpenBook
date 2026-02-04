import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  activeItem: string;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  setActiveItem: (item: string) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      isCollapsed: false,
      activeItem: "overview",
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      setActiveItem: (item) => set({ activeItem: item }),
    }),
    {
      name: "openbook-sidebar",
    },
  ),
);
