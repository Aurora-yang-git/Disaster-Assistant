export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  content: string;
  priority: number; // 1 = highest priority, shown first
}

export interface KnowledgeBase {
  knowledge: KnowledgeItem[];
  categories: Record<string, string>;
  sources: string[];
}

export interface KnowledgeSearchResult {
  item: KnowledgeItem;
  score: number; // Relevance score for ranking
}