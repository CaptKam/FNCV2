import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Storage } from '@/utils/storage';

const STORAGE_KEY = '@fork_compass_bookmarks';

interface BookmarksContextValue {
  bookmarkedIds: string[];
  isBookmarked: (recipeId: string) => boolean;
  toggleBookmark: (recipeId: string) => void;
  bookmarkCount: number;
}

const BookmarksContext = createContext<BookmarksContextValue>({
  bookmarkedIds: [],
  isBookmarked: () => false,
  toggleBookmark: () => {},
  bookmarkCount: 0,
});

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  useEffect(() => {
    Storage.get<string[]>(STORAGE_KEY, []).then(setBookmarkedIds);
  }, []);

  const persist = useCallback((ids: string[]) => {
    Storage.set(STORAGE_KEY, ids);
  }, []);

  const isBookmarked = useCallback(
    (recipeId: string) => bookmarkedIds.includes(recipeId),
    [bookmarkedIds]
  );

  const toggleBookmark = useCallback(
    (recipeId: string) => {
      setBookmarkedIds((prev) => {
        const next = prev.includes(recipeId)
          ? prev.filter((id) => id !== recipeId)
          : [...prev, recipeId];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return (
    <BookmarksContext.Provider
      value={{
        bookmarkedIds,
        isBookmarked,
        toggleBookmark,
        bookmarkCount: bookmarkedIds.length,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarksContext);
}
