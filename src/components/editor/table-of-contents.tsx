"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  level: number;
  text: string;
}

interface TableOfContentsProps {
  editor: Editor | null;
}

export function TableOfContents({ editor }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!editor) return;

    const updateToc = () => {
      const headings: TocItem[] = [];
      const { doc } = editor.state;

      doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const id = `heading-${pos}`;
          headings.push({
            id,
            level: node.attrs.level as number,
            text: node.textContent,
          });
        }
      });

      setItems(headings);
    };

    // Initial update
    updateToc();

    // Listen for changes
    editor.on("update", updateToc);

    return () => {
      editor.off("update", updateToc);
    };
  }, [editor]);

  const scrollToHeading = (item: TocItem) => {
    if (!editor) return;

    const { doc } = editor.state;
    let targetPos = 0;

    doc.descendants((node, pos) => {
      if (node.type.name === "heading" && `heading-${pos}` === item.id) {
        targetPos = pos;
        return false;
      }
    });

    if (targetPos > 0) {
      editor.chain().focus().setTextSelection(targetPos).run();
      setActiveId(item.id);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        暂无标题
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <nav className="p-4 space-y-1">
        <h3 className="text-sm font-medium mb-3">大纲</h3>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item)}
            className={cn(
              "block w-full text-left text-sm py-1 px-2 rounded transition-colors",
              "hover:bg-muted truncate",
              item.level === 1 && "font-medium",
              item.level === 2 && "pl-4",
              item.level === 3 && "pl-6 text-muted-foreground",
              item.level === 4 && "pl-8 text-muted-foreground text-xs",
              activeId === item.id && "bg-primary/10 text-primary"
            )}
          >
            {item.text || "(空标题)"}
          </button>
        ))}
      </nav>
    </ScrollArea>
  );
}
