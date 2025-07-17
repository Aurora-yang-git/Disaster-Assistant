import { KnowledgeBase, KnowledgeItem } from './types';
import earthquakeKnowledge from './earthquakeKnowledge.json';

export class KnowledgeLoader {
  private static instance: KnowledgeLoader;
  private knowledge: KnowledgeBase;

  private constructor() {
    this.knowledge = earthquakeKnowledge as KnowledgeBase;
  }

  public static getInstance(): KnowledgeLoader {
    if (!KnowledgeLoader.instance) {
      KnowledgeLoader.instance = new KnowledgeLoader();
    }
    return KnowledgeLoader.instance;
  }

  public getKnowledge(): KnowledgeBase {
    return this.knowledge;
  }

  public getKnowledgeItems(): KnowledgeItem[] {
    return this.knowledge.knowledge;
  }

  public getItemById(id: string): KnowledgeItem | undefined {
    return this.knowledge.knowledge.find(item => item.id === id);
  }

  public getItemsByCategory(category: string): KnowledgeItem[] {
    return this.knowledge.knowledge.filter(item => item.category === category);
  }

  public getItemsByPriority(priority: number): KnowledgeItem[] {
    return this.knowledge.knowledge.filter(item => item.priority === priority);
  }

  public getAllCategories(): Record<string, string> {
    return this.knowledge.categories;
  }

  public getSources(): string[] {
    return this.knowledge.sources;
  }

  // Simple keyword matching for now
  public searchByKeywords(query: string): KnowledgeItem[] {
    const queryLower = query.toLowerCase();
    const results: { item: KnowledgeItem, score: number }[] = [];

    for (const item of this.knowledge.knowledge) {
      let score = 0;
      
      // Check keywords (highest weight)
      for (const keyword of item.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // Check title (medium weight)
      if (item.title.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // Check content (lowest weight)
      if (item.content.toLowerCase().includes(queryLower)) {
        score += 1;
      }

      if (score > 0) {
        results.push({ item, score });
      }
    }

    // Sort by score (descending) and priority (ascending)
    results.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.item.priority - b.item.priority;
    });

    return results.map(result => result.item);
  }
}