"use client";

import { useState } from "react";
import { MoreHorizontal, FileText, Globe, FileIcon, Trash2, FolderOpen, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { CollectedDocument, DocumentSource, Tag } from "@/types/document";

interface DocumentCardProps {
  document: CollectedDocument;
  tags?: Tag[];
  onSelect?: (doc: CollectedDocument) => void;
  onDelete?: (id: string) => void;
  onOpenInEditor?: (doc: CollectedDocument) => void;
}

const sourceIcons: Record<DocumentSource, React.ReactNode> = {
  web: <Globe className="h-4 w-4" />,
  pdf: <FileIcon className="h-4 w-4" />,
  markdown: <FileText className="h-4 w-4" />,
  local: <FileText className="h-4 w-4" />,
};

const sourceLabels: Record<DocumentSource, string> = {
  web: "网页",
  pdf: "PDF",
  markdown: "Markdown",
  local: "本地文件",
};

export function DocumentCard({
  document,
  tags = [],
  onSelect,
  onDelete,
  onOpenInEditor,
}: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const documentTags = tags.filter((tag) => document.tags.includes(tag.id));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(document)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            {sourceIcons[document.source]}
            <span className="text-xs">{sourceLabels[document.source]}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${isHovered ? "opacity-100" : "opacity-0"} transition-opacity`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInEditor?.(document);
                }}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                在编辑器中打开
              </DropdownMenuItem>
              
              {document.sourceUrl && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(document.sourceUrl, "_blank");
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  访问原始链接
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(document.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <h3 className="line-clamp-2 text-base font-semibold leading-tight">
          {document.title}
        </h3>
      </CardHeader>

      <CardContent className="pb-2">
        {document.excerpt && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {document.excerpt}
          </p>
        )}
        
        {documentTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {documentTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: tag.color + "20", color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 text-xs text-muted-foreground">
        <div className="flex w-full items-center justify-between">
          <span>{formatDate(document.createdAt)}</span>
          <div className="flex items-center gap-2">
            {document.wordCount && (
              <span>{document.wordCount.toLocaleString()} 字</span>
            )}
            {document.readingTime && (
              <span>· {document.readingTime} 分钟阅读</span>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
