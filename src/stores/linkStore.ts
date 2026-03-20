import { create } from 'zustand';

export interface Link {
  _id: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

interface LinkState {
  links: Link[];
  isLoading: boolean;
  error: string | null;
  fetchLinks: () => Promise<void>;
  addLink: (link: Partial<Link>) => Promise<void>;
  updateLink: (id: string, link: Partial<Link>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  parseUrl: (url: string) => Promise<{ title: string; description: string; imageUrl: string }>;
}

export const useLinkStore = create<LinkState>((set, get) => ({
  links: [],
  isLoading: false,
  error: null,
  
  fetchLinks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/links');
      if (!res.ok) throw new Error('Failed to fetch links');
      const data = await res.json();
      set({ links: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addLink: async (link) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(link),
      });
      if (!res.ok) throw new Error('Failed to add link');
      const newLink = await res.json();
      set((state) => ({ links: [newLink, ...state.links], isLoading: false }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateLink: async (id, link) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(link),
      });
      if (!res.ok) throw new Error('Failed to update link');
      const updatedLink = await res.json();
      set((state) => ({
        links: state.links.map((l) => (l._id === id ? updatedLink : l)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteLink: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete link');
      set((state) => ({
        links: state.links.filter((l) => l._id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  parseUrl: async (url) => {
    const res = await fetch('/api/links/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Failed to parse URL metadata');
    return res.json();
  },
}));
