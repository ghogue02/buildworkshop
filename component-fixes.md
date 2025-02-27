# Component Fixes for MVPPlanner and GiveGetFeedback

Both the MVPPlanner and GiveGetFeedback components are showing issues in the console logs. Here are specific fixes for these components to address the loading problems.

## MVPPlanner Component Fix

The MVPPlanner component needs to be updated to handle cases where data might not be available and to improve error handling.

### Key Changes

1. Update the `loadExistingData` function to handle empty data better
2. Improve error handling
3. Ensure the component doesn't get stuck in a loading state

```javascript
// In MVPPlanner.js, update the loadExistingData function
const loadExistingData = async () => {
  if (!sessionId) {
    debugLog('No sessionId provided, skipping data load');
    setLoading(false); // Ensure loading is set to false even if no sessionId
    return;
  }

  debugLog(`Loading existing data for session ${sessionId}`);
  try {
    // Use withRetry for better reliability
    const { data, error } = await withRetry(async () => {
      debugLog('Fetching MVP Planner data from Supabase');
      return await supabase
        .from('user_inputs')
        .select('input_data')
        .eq('session_id', sessionId)
        .eq('section_name', 'MVP Planner')
        .maybeSingle();
    }, 3, 2000);

    if (error) {
      if (error.code !== 'PGRST116') {
        debugLog(`Error fetching data: ${error.code}`, error);
        throw error;
      } else {
        debugLog('No existing data found (PGRST116)');
      }
    }

    if (data?.input_data) {
      debugLog('Data loaded successfully', data.input_data);
      setAiOptions(data.input_data.aiOptions || ['', '', '']);
      setHowItWorks(data.input_data.howItWorks || '');
      setDataNeeds(data.input_data.dataNeeds || '');
      setUserExperience(data.input_data.userExperience || '');
      setValueProposition(data.input_data.valueProposition || '');
    } else {
      debugLog('No data or empty data returned, initializing with defaults');
      // Initialize with default values
      setAiOptions(['', '', '']);
      setHowItWorks('');
      setDataNeeds('');
      setUserExperience('');
      setValueProposition('');
    }
  } catch (error) {
    debugLog('Error loading data:', error);
    console.error('Error loading data:', error);
    // Initialize with default values on error
    setAiOptions(['', '', '']);
    setHowItWorks('');
    setDataNeeds('');
    setUserExperience('');
    setValueProposition('');
  } finally {
    if (isMounted.current) {
      setLoading(false);
      debugLog('Loading state set to false');
    }
  }
};
```

### Additional Improvements

1. Add a timeout to prevent infinite loading:

```javascript
// Add at the beginning of the component
useEffect(() => {
  // Set a timeout to prevent infinite loading
  const loadingTimeout = setTimeout(() => {
    if (loading && isMounted.current) {
      debugLog('Loading timeout reached, forcing loading state to false');
      setLoading(false);
    }
  }, 5000); // 5 second timeout

  return () => {
    clearTimeout(loadingTimeout);
  };
}, [loading]);
```

2. Add a connection error state:

```javascript
// Add to state declarations
const [connectionError, setConnectionError] = useState(null);

// Update the loadExistingData function to set connection errors
if (error) {
  if (error.code !== 'PGRST116') {
    debugLog(`Error fetching data: ${error.code}`, error);
    setConnectionError(`Database error: ${error.message}`);
    throw error;
  } else {
    debugLog('No existing data found (PGRST116)');
  }
}

// Add to the catch block
if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
  const errorMsg = 'Network error: Could not connect to Supabase. Please check your internet connection.';
  setConnectionError(errorMsg);
}

// Add to the UI to display connection errors
{connectionError && (
  <div style={{
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    width: '100%'
  }}>
    <strong>Connection Error:</strong> {connectionError}
  </div>
)}
```

## GiveGetFeedback Component Fix

The GiveGetFeedback component needs similar updates to handle cases where data might not be available and to improve error handling.

### Key Changes

1. Update the `loadExistingData` function to handle empty data better
2. Improve error handling
3. Ensure the component doesn't get stuck in a loading state

```javascript
// In GiveGetFeedback.js, update the loadExistingData function
const loadExistingData = async () => {
  if (!sessionId) {
    debugLog('No sessionId provided, skipping data load');
    setLoading(false); // Ensure loading is set to false even if no sessionId
    return;
  }

  debugLog(`Loading existing data for session ${sessionId}`);
  try {
    // Use withRetry for better reliability
    const { data, error } = await withRetry(async () => {
      debugLog('Fetching Give & Get Feedback data from Supabase');
      return await supabase
        .from('user_inputs')
        .select('input_data')
        .eq('session_id', sessionId)
        .eq('section_name', 'Give & Get Feedback')
        .maybeSingle();
    }, 3, 2000);

    if (error) {
      if (error.code !== 'PGRST116') {
        debugLog(`Error fetching data: ${error.code}`, error);
        throw error;
      } else {
        debugLog('No existing data found (PGRST116)');
      }
    }

    if (data?.input_data) {
      debugLog('Data loaded successfully', data.input_data);
      setShare(data.input_data.share || '');
      setRequestFeedback(data.input_data.requestFeedback || '');
      setGiveFeedback(data.input_data.giveFeedback || '');
      setCapture(data.input_data.capture || '');
    } else {
      debugLog('No data or empty data returned, initializing with defaults');
      // Initialize with default values
      setShare('');
      setRequestFeedback('');
      setGiveFeedback('');
      setCapture('');
    }
  } catch (error) {
    debugLog('Error loading data:', error);
    console.error('Error loading data:', error);
    // Initialize with default values on error
    setShare('');
    setRequestFeedback('');
    setGiveFeedback('');
    setCapture('');
  } finally {
    if (isMounted.current) {
      setLoading(false);
      debugLog('Loading state set to false');
    }
  }
};
```

### Additional Improvements

Apply the same timeout and connection error handling as described for the MVPPlanner component.

## Common Improvements for Both Components

1. Add a key prop when rendering the components in BuilderView.js:

```javascript
{currentSection === 'mvpplanner' && (
  <MVPPlanner 
    onSave={handleSectionSave} 
    sessionId={sessionId} 
    key={`mvp-${sessionId}`} 
  />
)}

{currentSection === 'givegetfeedback' && (
  <GiveGetFeedback 
    onSave={handleSectionSave} 
    sessionId={sessionId} 
    key={`feedback-${sessionId}`} 
  />
)}
```

2. Improve the cleanup function in both components:

```javascript
// Cleanup function
useEffect(() => {
  debugLog('Component mounted');
  
  return () => {
    debugLog('Component unmounting, cleaning up');
    isMounted.current = false;
    
    // Cancel any pending timeouts or intervals
    // (if you have any in your component)
  };
}, []);
```

3. Add a retry mechanism for saving data:

```javascript
// In the saveData function
let retryCount = 0;
const maxRetries = 3;

const attemptSave = async () => {
  try {
    // Save data logic...
    
    // Success, reset retry count
    retryCount = 0;
  } catch (error) {
    debugLog(`Save attempt failed (${retryCount + 1}/${maxRetries})`, error);
    
    if (retryCount < maxRetries - 1) {
      retryCount++;
      debugLog(`Retrying save in ${retryCount * 1000}ms...`);
      setTimeout(attemptSave, retryCount * 1000);
    } else {
      // Max retries reached, handle the error
      debugLog('Max retry attempts reached, giving up');
      setSaveStatus(`Error: ${error.message || 'Failed to save'}`);
    }
  }
};

attemptSave();
```

These improvements should address the loading issues and make the components more resilient to errors and edge cases.