# Improved Builder Input Analysis Plan

## Current Limitations
The current word frequency analysis has several limitations:
- Single words lack context and meaning
- All fields are analyzed together, losing structural information
- No semantic understanding of the content
- No comparison between successful and struggling builders
- No tracking of progression through the builder journey

## Improved Analysis Approaches

### 1. Structured Field Analysis
Instead of analyzing all text together, we should analyze specific fields separately:

**Problem Definition:**
- Summary: Core problem statement
- Context: Background and situation
- Impact: Effects and importance
- Root Causes: Underlying issues

**MVP Planner:**
- How It Works: Technical approach
- Data Needs: Information requirements
- User Experience: Interface and interactions
- Value Proposition: Core benefits

This would provide more targeted insights about each aspect of the builder's thinking.

### 2. Phrase Extraction
Moving beyond single words to meaningful phrases:

- Use n-gram analysis (2-3 word combinations)
- Apply TF-IDF weighting to identify important phrases
- Filter out common stopwords and focus on meaningful combinations
- Group similar phrases using stemming/lemmatization

Example implementation:
```javascript
function extractPhrases(text, n=2) {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const phrases = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    phrases.push(words.slice(i, i + n).join(' '));
  }
  
  return phrases;
}
```

### 3. Topic Modeling
Group similar inputs by topic clusters:

- Use techniques like Latent Dirichlet Allocation (LDA)
- Identify 5-10 common themes across builder inputs
- Show distribution of topics to understand focus areas
- Track how topics evolve through the builder journey

This could be implemented using a library like BrainJS or by sending batched data to an API for processing.

### 4. Comparative Analysis
Compare inputs between successful completions vs. dropoffs:

- Split builders into groups based on completion status
- Analyze differences in language, complexity, and focus
- Identify patterns that correlate with success
- Show what distinguishes successful builders

Example metrics:
- Input length and detail level
- Specificity of problem statements
- Clarity of solution descriptions
- Consistency across sections

### 5. Progression Analysis
Track how inputs evolve through the builder journey:

- Compare early vs. late section inputs from the same builder
- Identify refinements and pivots
- Measure consistency vs. change in approach
- Detect when major shifts in thinking occur

### 6. Visualization Improvements

**Problem Space Map:**
- Create a 2D visualization of problem spaces
- Group similar problems visually
- Show clusters and outliers
- Allow filtering by completion status

**Solution Approach Sankey Diagram:**
- Show flow from problem types to solution approaches
- Visualize common paths and unusual combinations
- Highlight successful paths vs. abandoned ones

**Builder Journey Timeline:**
- Show progression of key metrics through sections
- Track complexity, specificity, and confidence
- Identify common points where builders pivot or refine

## Implementation Strategy

### Phase 1: Enhanced Text Analysis
1. Implement structured field analysis
2. Add phrase extraction (bigrams/trigrams)
3. Improve visualization of results
4. Add basic comparative metrics

### Phase 2: Advanced Analytics
1. Implement topic modeling
2. Add progression analysis
3. Create problem space visualization
4. Develop comparative success metrics

### Phase 3: AI-Powered Insights
1. Integrate with OpenAI for deeper semantic analysis
2. Generate natural language insights
3. Provide personalized recommendations
4. Enable interactive exploration of patterns

## Technical Approach

### Client-Side Processing
For immediate implementation, we can enhance the client-side processing:

```javascript
function analyzeFieldContent(inputs, fieldName) {
  // Extract all values for this field
  const fieldValues = inputs
    .map(input => input.input_data[fieldName])
    .filter(Boolean);
  
  // Extract phrases (bigrams)
  const phrases = [];
  fieldValues.forEach(value => {
    if (typeof value === 'string') {
      const extracted = extractPhrases(value, 2);
      phrases.push(...extracted);
    }
  });
  
  // Count frequencies
  const counts = {};
  phrases.forEach(phrase => {
    counts[phrase] = (counts[phrase] || 0) + 1;
  });
  
  // Return top phrases
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }));
}
```

### Server-Side Processing
For more advanced analysis, we could implement server-side processing:

1. Create a new Supabase function for analysis
2. Process inputs in batches for efficiency
3. Store analysis results for quick retrieval
4. Update periodically as new data comes in

## Next Steps

1. Implement enhanced text analysis in the BuilderInputReport component
2. Add field-specific analysis for Problem Definition and MVP Planner
3. Create improved visualizations for phrase frequency
4. Add basic comparative metrics between completion groups
5. Test with real builder data and refine approach