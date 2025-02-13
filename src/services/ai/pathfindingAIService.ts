import { BaseAIService } from './baseAIService';

interface PathAnalysis {
  algorithmAnalysis: string;
  comparison: string;
  recommendation: string;
}

export class PathfindingAIService extends BaseAIService {
  async analyzePathfinding(
    currentAlgorithm: string,
    mazeStats: {
      totalNodes: number;
      wallNodes: number;
      visitedNodes: number;
      pathLength: number;
      executionTime: number;
    }
  ): Promise<PathAnalysis> {
    const wallDensity = ((mazeStats.wallNodes / mazeStats.totalNodes) * 100).toFixed(1);
    const visitedPercent = ((mazeStats.visitedNodes / mazeStats.totalNodes) * 100).toFixed(1);
    
    const prompt = `Analyze this pathfinding scenario and return a JSON response with this exact structure:
{
  "algorithmAnalysis": {
    "performance": "Brief performance summary",
    "reasoning": "Detailed explanation"
  },
  "comparison": {
    "A*": { "performance": "summary", "reasoning": "explanation" },
    "Dijkstra": { "performance": "summary", "reasoning": "explanation" },
    "BFS": { "performance": "summary", "reasoning": "explanation" }
  },
  "recommendation": {
    "algorithm": "recommended algorithm name",
    "reasoning": "detailed explanation why"
  }
}

Current Algorithm: ${currentAlgorithm.toUpperCase()}
Maze Stats:
- Grid Size: ${mazeStats.totalNodes} nodes
- Wall Density: ${wallDensity}%
- Nodes Explored: ${visitedPercent}%
- Path Length: ${mazeStats.pathLength} nodes
- Time: ${mazeStats.executionTime}ms

Focus on performance metrics and maze characteristics in your analysis.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        const parsed = JSON.parse(this.formatResponse(text));
        
        return {
          algorithmAnalysis: parsed.algorithmAnalysis?.reasoning || 
                            parsed.algorithmAnalysis?.performance || 
                            "Analysis not available",
          
          comparison: Object.entries(parsed.comparison || {})
            .map(([algo, data]: [string, any]) => {
              if (data?.reasoning) {
                return `${algo}: ${data.reasoning}`;
              }
              return data?.performance || '';
            })
            .filter(text => text)
            .join('\n\n'),
          
          recommendation: parsed.recommendation?.reasoning || 
                         `Recommended Algorithm: ${parsed.recommendation?.algorithm || currentAlgorithm}` ||
                         "Recommendation not available"
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Try to extract content from non-JSON response
        const sections = text.split(/\d+[\.)]/);
        return {
          algorithmAnalysis: this.cleanupText(sections[1] || ''),
          comparison: this.cleanupText(sections[2] || ''),
          recommendation: this.cleanupText(sections[3] || '')
        };
      }
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      throw error;
    }
  }

  private cleanupText(text: string): string {
    return text
      .trim()
      .replace(/^[:"'\s]+|[:"'\s]+$/g, '')  // Remove quotes and colons
      .replace(/\s+/g, ' ')                 // Normalize whitespace
      .replace(/\\n/g, ' ')                 // Remove newlines
      .replace(/[{}]/g, '')                 // Remove braces
      .trim();
  }
}

export const pathfindingAIService = new PathfindingAIService();
