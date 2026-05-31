/**
 * Format search results with source attribution
 * Makes it crystal clear where information comes from
 */

export function formatResultsWithSources(results, searchType = 'hybrid') {
  if (!results || results.length === 0) {
    return {
      answer: 'No knowledge found for this query.',
      sources: [],
      metadata: {
        searchType,
        resultsCount: 0,
        storage: 'none'
      }
    };
  }

  // Build formatted response
  let formattedText = '';
  const sources = [];

  // Header
  formattedText += `📚 Found ${results.length} relevant knowledge entr${results.length === 1 ? 'y' : 'ies'}\n`;
  formattedText += `🔍 Search Method: ${searchType}\n\n`;
  formattedText += `---\n\n`;

  // Process each result
  results.forEach((result, index) => {
    const num = index + 1;
    
    // Extract metadata
    const title = result.title || result.entry?.title || 'Untitled';
    const content = result.content || result.entry?.content || '';
    const category = result.category || result.file || 'general';
    const score = result.score || result.relevance || 0;
    const source = result.source || result.entry?._metadata?.source || 'internal';
    const dateAdded = result.entry?._metadata?.dateAdded || 'unknown';
    const mendixVersion = result.entry?._metadata?.mendixVersion || 'all versions';
    
    // Format entry
    formattedText += `## ${num}. ${title}\n\n`;
    
    // Metadata box
    formattedText += `**📊 Source Information:**\n`;
    formattedText += `- Category: ${category}\n`;
    formattedText += `- Relevance: ${(score * 100).toFixed(1)}%\n`;
    formattedText += `- Source: ${source}\n`;
    formattedText += `- Date Added: ${dateAdded}\n`;
    formattedText += `- Mendix Version: ${mendixVersion}\n`;
    formattedText += `\n`;
    
    // Content
    formattedText += `**📝 Content:**\n`;
    formattedText += content.substring(0, 500);
    if (content.length > 500) {
      formattedText += '...\n\n*[Content truncated for brevity]*\n';
    }
    formattedText += `\n\n---\n\n`;
    
    // Add to sources array
    sources.push({
      index: num,
      title,
      category,
      score,
      source,
      dateAdded,
      mendixVersion
    });
  });

  // Footer with metadata
  formattedText += `\n**🔍 Search Metadata:**\n`;
  formattedText += `- Total Results: ${results.length}\n`;
  formattedText += `- Search Type: ${searchType}\n`;
  formattedText += `- Storage: ${results[0]?.storage || 'supabase'}\n`;
  
  if (results[0]?.searchMethod) {
    formattedText += `- Method: ${results[0].searchMethod}\n`;
  }

  return {
    answer: formattedText,
    sources,
    metadata: {
      searchType,
      resultsCount: results.length,
      storage: results[0]?.storage || 'supabase',
      avgScore: sources.reduce((sum, s) => sum + s.score, 0) / sources.length
    }
  };
}

/**
 * Format with quality assessment
 */
export function formatWithQualityAssessment(results, query, searchType = 'hybrid') {
  const formatted = formatResultsWithSources(results, searchType);
  
  // Assess answer quality
  const avgScore = formatted.metadata.avgScore || 0;
  const resultCount = formatted.metadata.resultsCount;
  
  let quality = 'unknown';
  let recommendation = '';
  
  if (resultCount === 0) {
    quality = 'no_results';
    recommendation = '❌ No knowledge found. Consider using Beast Mode research to find and add this information.';
  } else if (avgScore > 0.7) {
    quality = 'excellent';
    recommendation = '✅ High confidence - Multiple relevant sources found.';
  } else if (avgScore > 0.5) {
    quality = 'good';
    recommendation = '✓ Good match - Sources are somewhat relevant.';
  } else if (avgScore > 0.3) {
    quality = 'fair';
    recommendation = '⚠️ Fair match - Consider searching with different terms or using Beast Mode.';
  } else {
    quality = 'poor';
    recommendation = '❌ Low confidence - Results may not be relevant. Beast Mode research recommended.';
  }
  
  // Add quality section
  let fullAnswer = `**🎯 Answer Quality: ${quality.toUpperCase()}**\n`;
  fullAnswer += `${recommendation}\n\n`;
  fullAnswer += `---\n\n`;
  fullAnswer += formatted.answer;
  
  return {
    answer: fullAnswer,
    sources: formatted.sources,
    metadata: {
      ...formatted.metadata,
      quality,
      recommendation,
      query
    }
  };
}

/**
 * Create citation format (for when you want minimal citations)
 */
export function createCitations(results) {
  if (!results || results.length === 0) return '';
  
  let citations = '\n\n**📚 Sources:**\n';
  
  results.forEach((result, index) => {
    const num = index + 1;
    const title = result.title || result.entry?.title || 'Untitled';
    const source = result.source || result.entry?._metadata?.source || 'internal';
    const category = result.category || result.file || 'general';
    
    citations += `[${num}] ${title} (${category}) - ${source}\n`;
  });
  
  return citations;
}

export default {
  formatResultsWithSources,
  formatWithQualityAssessment,
  createCitations
};
