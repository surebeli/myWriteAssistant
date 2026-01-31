"use client";

import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/use-search";

interface SearchBarProps {
  onResultSelect?: (documentId: string) => void;
}

export function SearchBar({ onResultSelect }: SearchBarProps) {
  const { query, results, suggestions, isSearching, search, clearSearch } = useSearch();

  const handleClear = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="搜索文档..."
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 搜索结果下拉 */}
      {query && (results.length > 0 || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-2 shadow-lg">
          {isSearching && (
            <div className="px-2 py-1 text-sm text-muted-foreground">
              搜索中...
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                搜索结果 ({results.length})
              </div>
              {results.slice(0, 5).map((result) => (
                <button
                  key={result.id}
                  className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onResultSelect?.(result.id);
                    clearSearch();
                  }}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium">{result.title}</div>
                    {result.excerpt && (
                      <div className="truncate text-xs text-muted-foreground">
                        {result.excerpt}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(result.score * 100)}%
                  </div>
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && results.length === 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                建议
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => search(suggestion)}
                >
                  <Search className="h-3 w-3 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {!isSearching && results.length === 0 && suggestions.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              未找到匹配的文档
            </div>
          )}
        </div>
      )}
    </div>
  );
}
