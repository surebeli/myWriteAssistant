"use client";

import { useState, useCallback, useRef } from "react";
import {
  searchDocuments,
  getSearchSuggestions,
} from "@/lib/search-engine";
import type { SearchResult } from "@/types/document";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }
    
    // 清除之前的防抖
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // 防抖搜索
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        const [searchResults, searchSuggestions] = await Promise.all([
          searchDocuments(searchQuery),
          getSearchSuggestions(searchQuery),
        ]);
        
        setResults(searchResults);
        setSuggestions(searchSuggestions);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 200);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setSuggestions([]);
  }, []);

  return {
    query,
    results,
    suggestions,
    isSearching,
    search,
    clearSearch,
  };
}
