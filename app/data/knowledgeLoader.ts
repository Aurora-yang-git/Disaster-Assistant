import { KnowledgeBase, KnowledgeItem } from './types';
import earthquakeKnowledge from './earthquakeKnowledge.json';

export class KnowledgeLoader {
  private static instance: KnowledgeLoader;
  private knowledge: KnowledgeBase;

  private constructor() {
    this.knowledge = earthquakeKnowledge as KnowledgeBase;
    // TODO: Future optimization - build inverted index for faster search
    // this.buildInvertedIndex();
  }

  /**
   * Future optimization: Build inverted index for O(1) keyword lookup
   * Format: { "keyword": ["item-id-1", "item-id-2"] }
   * This would replace the current O(n) search with O(1) lookup
   */
  /*
  private buildInvertedIndex(): void {
    const index: Record<string, string[]> = {};
    
    for (const item of this.knowledge.knowledge) {
      for (const keyword of item.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (!index[keywordLower]) {
          index[keywordLower] = [];
        }
        index[keywordLower].push(item.id);
      }
    }
    
    this.invertedIndex = index;
  }
  */

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

  /**
   * Enhanced keyword matching with whole-word precision
   * Splits query into words to prevent false positives (e.g., "art" matching "earthquake")
   */
  public searchByKeywords(query: string): KnowledgeItem[] {
    const queryLower = query.toLowerCase();
    
    // Split the user's query into individual words
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    
    const results: { item: KnowledgeItem, score: number }[] = [];

    for (const item of this.knowledge.knowledge) {
      let score = 0;
      
      // Check keywords (highest weight) - use exact word matching
      for (const keyword of item.keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Check if any query word exactly matches this keyword
        if (queryWords.includes(keywordLower)) {
          score += 10;
        }
        
        // Also check if the full query contains this keyword as substring
        // (for phrases like "地震" or multi-word keywords)
        else if (queryLower.includes(keywordLower)) {
          score += 8;
        }
      }

      // Check title (medium weight) - keep substring matching for titles
      if (item.title.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // Check content (lowest weight) - keep substring matching for content
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