import { createContext, useContext, useState, type ReactNode } from "react";
import { menuTags as initialTags, type MenuTag } from "./mock-data";

interface TagsStore {
	tags: MenuTag[];
	addTag: (tag: Omit<MenuTag, "id">) => void;
	updateTag: (id: string, updates: Partial<MenuTag>) => void;
	removeTag: (id: string) => void;
}

const TagsContext = createContext<TagsStore>(null!);

export function TagsProvider({ children }: { children: ReactNode }) {
	const [tags, setTags] = useState<MenuTag[]>(initialTags);

	const addTag = (tag: Omit<MenuTag, "id">) =>
		setTags((prev) => [...prev, { ...tag, id: `tag-${Date.now()}` }]);

	const updateTag = (id: string, updates: Partial<MenuTag>) =>
		setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));

	const removeTag = (id: string) =>
		setTags((prev) => prev.filter((t) => t.id !== id));

	return (
		<TagsContext.Provider value={{ tags, addTag, updateTag, removeTag }}>
			{children}
		</TagsContext.Provider>
	);
}

export const useTags = () => useContext(TagsContext);
