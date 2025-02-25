import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withRetry } from '../supabaseClient';
import ProblemDefinition from '../ProblemDefinition';
import MVPPlanner from '../MVPPlanner';
import GiveGetFeedback from '../GiveGetFeedback';
import RefineYourMVP from '../RefineYourMVP';
import StartBuild from '../StartBuild';
import PresentationsRetro from '../PresentationsRetro';
import VideoReflection from '../VideoReflection';

const schedule = [
  { id: 0, name: 'Welcome & Intro: Pursuit & AI', duration: '0:10', start: '11:30 AM', end: '11:40 AM' },
  { id: 1, name: 'Daily Standup', duration: '0:15', start: '11:40 AM', end: '11:55 AM' },
  {
    id: 2,
    name: 'Workshop',
    items: [
      { name: 'Introducing the workshop', duration: '0:10', start: '11:55 AM', end: '12:05 PM' },
      { name: 'Analyze & Research', duration: '0:35', start: '12:05 PM', end: '12:40 PM' },
      { name: 'Develop the MVP Product Idea', duration: '0:20', start: '12:40 PM', end: '1:00 PM' },
      { name: 'Lunch!', duration: '0:30', start: '1:00 PM', end: '1:30 PM', highlight: true },
      { name: 'Give & Get Feedback', duration: '0:35', start: '1:30 PM', end: '2:05 PM' },
      { name: 'Refine your product MVP', duration: '0:15', start: '2:05 PM', end: '2:20 PM' },
      { name: 'Build!', duration: '1:00', start: '2:20 PM', end: '3:20 PM' },
      { name: 'Break + Prep', duration: '0:15', start: '3:20 PM', end: '3:35 PM' },
    ]
  },
  { id: 3, name: 'Presentation + Retro', duration: '0:45', start: '3:35 PM', end: '4:20 PM' },
  { id: 4, name: 'Closing', duration: '0:15', start: '4:20 PM', end: '4:30 PM' }
];

function BuilderView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentSection, setCurrentSection] = useState('userinfo');
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [userInputs, setUserInputs] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isMounted = useRef(true);

  const sectionOrder = [
    'User Info',
    'Problem Definition',
    'MVP Planner',
    'Give & Get Feedback',
    'Refine Your MVP',
    'Start Build',
    'Presentations & Retro',
    'Video Reflection'
  ];

  const generateAISummary = (inputs) => {
    const problemDef = inputs.find(i => i.section_name === 'Problem Definition')?.input_data || {};
    const aiSolution = inputs.find(i => i.section_name === 'MVP Planner')?.input_data || {};
    const refinements = inputs.find(i => i.section_name === 'Refine Your MVP')?.input_data || {};
    
    return (
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>🎓 AI Project Review Summary</h3>
        <p style={{ lineHeight: '1.6' }}>
          You've developed a project addressing the problem of "{problemDef.summary}". Your solution leverages AI technology 
          through {aiSolution.aiOptions?.[0]} {aiSolution.howItWorks ? `with a focus on ${aiSolution.howItWorks}` : ''}.
          {refinements.productRefinement ? ` Through iteration, you've enhanced the concept by ${refinements.productRefinement}.` : ''}
        </p>
        <p style={{ lineHeight: '1.6' }}>
          Key strengths of your approach include:
          {problemDef.impact ? `\n• Understanding of impact: ${problemDef.impact}` : ''}
          {aiSolution.valueProposition ? `\n• Clear value proposition: ${aiSolution.valueProposition}` : ''}
          {refinements.keyImprovements ? `\n• Thoughtful improvements: ${refinements.keyImprovements}` : ''}
        </p>
        <p style={{ fontStyle: 'italic', marginTop: '15px', color: '#888' }}>
          Keep iterating on your solution and consider gathering more user feedback to further refine the implementation.
        </p>
      </div>
    );
  };

  const formatSectionData = (sectionName, data) => {
    switch (sectionName) {
      case 'User Info':
        return (
          <div>
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
          </div>
        );
      case 'Problem Definition':
        return (
          <div>
            <p><strong>Summary:</strong> {data.summary}</p>
            <p><strong>Context:</strong> {data.context}</p>
            <p><strong>Impact:</strong> {data.impact}</p>
            <p><strong>Root Causes:</strong> {data.rootCauses}</p>
            <p><strong>Outcome:</strong> {data.outcome}</p>
          </div>
        );
      case 'MVP Planner':
        return (
          <div>
            <p><strong>Ideas:</strong></p>
            <ul>
              {data.aiOptions?.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
            <p><strong>How It Works:</strong> {data.howItWorks}</p>
            <p><strong>Data Needs:</strong> {data.dataNeeds}</p>
            <p><strong>User Experience:</strong> {data.userExperience}</p>
            <p><strong>Value Proposition:</strong> {data.valueProposition}</p>
          </div>
        );
      case 'Give & Get Feedback':
        return (
          <div>
            <p><strong>Share:</strong> {data.share}</p>
            <p><strong>Request Feedback:</strong> {data.requestFeedback}</p>
            <p><strong>Give Feedback:</strong> {data.giveFeedback}</p>
            <p><strong>Capture:</strong> {data.capture}</p>
          </div>
        );
      case 'Refine Your MVP':
        return (
          <div>
            <p><strong>Feedback Integration:</strong> {data.feedbackIntegration}</p>
            <p><strong>AI Enhancement:</strong> {data.aiEnhancement}</p>
            <p><strong>Product Refinement:</strong> {data.productRefinement}</p>
            <p><strong>Key Improvements:</strong> {data.keyImprovements}</p>
          </div>
        );
      case 'Start Build':
        return (
          <div>
            <p><strong>What was built:</strong> {data.whatBuilt}</p>
            <p><strong>Functionality achieved:</strong> {data.functionality}</p>
            <p><strong>Future additions:</strong> {data.futureAdditions}</p>
            <p><strong>How AI helped:</strong> {data.aiHelp}</p>
          </div>
        );
      case 'Presentations & Retro':
        return (
          <div>
            <p><strong>Problem (20 sec):</strong> {data.problem}</p>
            <p><strong>Solution (25 sec):</strong> {data.solution}</p>
            <p><strong>Demo (50 sec):</strong> {data.demo}</p>
            <p><strong>Journey (25 sec):</strong> {data.journey}</p>
            <p><strong>Impact (10 sec):</strong> {data.impact}</p>
          </div>
        );
      default:
        return <pre>{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  const fetchUserInputs = useCallback(async () => {
    if (!sessionId) return;

    setReviewLoading(true);
    try {
      console.log('Fetching user inputs for session:', sessionId);
      
      // Use the withRetry helper to handle connection issues
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('*')
          .eq('session_id', sessionId);
      }, 3, 2000); // Retry up to 3 times with 2 second delay between retries

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data && isMounted.current) {
        console.log('Data fetched from Supabase:', data);
        const sortedData = [...data].sort((a, b) => {
          return sectionOrder.indexOf(a.section_name) - sectionOrder.indexOf(b.section_name);
        });
        setUserInputs(sortedData);
      } else {
        console.log('No data returned from Supabase or component unmounted');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Don't show alert to user, just log the error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error: Could not connect to Supabase. Please check your internet connection.');
      }
    } finally {
      if (isMounted.current) {
        setReviewLoading(false);
      }
    }
  }, [sessionId, sectionOrder]);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    if (storedName) setName(storedName);
    if (storedEmail) setEmail(storedEmail);

    if (!sessionId) {
      const newSessionId = crypto.randomUUID();
      console.log('Generated new session ID:', newSessionId);
      setSessionId(newSessionId);
      localStorage.setItem('sessionId', newSessionId);
    }

    return () => {
      isMounted.current = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (currentSection === 'review' && sessionId) {
      fetchUserInputs();
    }
  }, [currentSection, sessionId, fetchUserInputs]);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleUserInfoSubmit = async (event) => {
    event.preventDefault();

    if (!name || !email || !sessionId) {
      console.error('Cannot save user info: Missing required fields');
      return;
    }

    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);

    setSaving(true);
    try {
      console.log('Saving user info:', {
        session_id: sessionId,
        name,
        email
      });

      // Use withRetry for checking if a record exists
      const { data: existingData, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('user_inputs')
          .select('id')
          .eq('session_id', sessionId)
          .eq('section_name', 'User Info')
          .maybeSingle();
      }, 3, 2000);

      if (fetchError) {
        console.error('Error checking for existing user info:', fetchError);
        throw fetchError;
      }

      let error;
      if (existingData) {
        console.log('Updating existing user info record');
        // Update existing record with withRetry
        const { error: updateError } = await withRetry(async () => {
          return await supabase
            .from('user_inputs')
            .update({
              input_data: { name, email },
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('section_name', 'User Info');
        }, 3, 2000);
        
        error = updateError;
      } else {
        console.log('Creating new user info record');
        // Insert new record with withRetry
        const { error: insertError } = await withRetry(async () => {
          return await supabase
            .from('user_inputs')
            .insert({
              session_id: sessionId,
              section_name: 'User Info',
              input_data: { name, email }
            });
        }, 3, 2000);
        
        error = insertError;
      }

      if (error) {
        console.error('Database operation failed:', error);
        throw error;
      }

      console.log('User info saved successfully');
      alert('Your information has been saved!');
      setCurrentSection('problemdefinition');
    } catch (error) {
      console.error('Error saving data:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert('Network error: Could not connect to the database. Please check your internet connection and try again.');
      } else {
        alert('Error saving data: ' + (error.message || 'Unknown error'));
      }
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  };

  // Define getNextSection before it's used in handleSectionSave
  const getNextSection = useCallback((sectionName) => {
    switch (sectionName) {
      case 'Problem Definition':
        return 'mvpplanner';
      case 'MVP Planner':
        return 'givegetfeedback';
      case 'Give & Get Feedback':
        return 'refineyourmvp';
      case 'Refine Your MVP':
        return 'startbuild';
      case 'Start Build':
        return 'presentationsretro';
      case 'Presentations & Retro':
        return 'videoreflection';
      case 'Video Reflection':
        return 'review';
      default:
        return 'userinfo';
    }
  }, []);

  const handleSectionSave = useCallback(
    async (sectionName, sectionData) => {
      if (!sessionId) {
        console.error('Cannot save: No session ID available');
        return;
      }

      setSaving(true);
      try {
        console.log('Saving section data:', {
          session_id: sessionId,
          section_name: sectionName,
          data: sectionData
        });

        // First check if a record already exists with withRetry
        const { data: existingData, error: fetchError } = await withRetry(async () => {
          return await supabase
            .from('user_inputs')
            .select('id')
            .eq('session_id', sessionId)
            .eq('section_name', sectionName)
            .maybeSingle();
        }, 3, 2000);

        if (fetchError) {
          console.error('Error checking for existing data:', fetchError);
          throw fetchError;
        }

        let error;
        if (existingData) {
          console.log(`Updating existing record for ${sectionName}`);
          // Update existing record with withRetry
          const { error: updateError } = await withRetry(async () => {
            return await supabase
              .from('user_inputs')
              .update({
                input_data: sectionData,
                updated_at: new Date().toISOString()
              })
              .eq('session_id', sessionId)
              .eq('section_name', sectionName);
          }, 3, 2000);
          
          error = updateError;
        } else {
          console.log(`Creating new record for ${sectionName}`);
          // Insert new record with withRetry
          const { error: insertError } = await withRetry(async () => {
            return await supabase
              .from('user_inputs')
              .insert({
                session_id: sessionId,
                section_name: sectionName,
                input_data: sectionData
              });
          }, 3, 2000);
          
          error = insertError;
        }

        if (error) {
          console.error('Database operation failed:', error);
          throw error;
        }

        console.log('Section data saved successfully');
        // Don't automatically advance to next section - let the user control navigation
      } catch (error) {
        console.error('Error saving data:', error);
        
        // Provide more specific error messages
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          alert('Network error: Could not connect to the database. Please check your internet connection and try again.');
        } else {
          alert('Error saving data: ' + (error.message || 'Unknown error'));
        }
      } finally {
        if (isMounted.current) {
          setSaving(false);
        }
      }
    },
    [sessionId, getNextSection]
  );

  const handleEdit = (sectionName) => {
    setCurrentSection(sectionName.toLowerCase().replace(/\s+/g, ''));
  };

  const renderSchedule = () => (
    <div style={{ 
      marginTop: '20px',
      padding: '20px',
      border: '1px solid white',
      borderRadius: '8px',
      backgroundColor: '#1a1a1a'
    }}>
      <h3 style={{ marginTop: 0 }}>📅 Today's Schedule</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {schedule.map((item) => (
          <div key={item.id}>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 100px 200px',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 0'
            }}>
              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
              <span style={{ color: '#888', textAlign: 'center' }}>{item.duration}</span>
              <span style={{ textAlign: 'right' }}>{item.start} - {item.end}</span>
            </div>
            {item.items && (
              <div style={{ marginLeft: '20px' }}>
                {item.items.map((subItem, index) => (
                  <div key={index} style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 200px',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '5px 0',
                    backgroundColor: subItem.highlight ? '#4CAF50' : 'transparent',
                    borderRadius: '4px',
                    padding: subItem.highlight ? '8px' : '5px 0'
                  }}>
                    <span>{subItem.name}</span>
                    <span style={{ color: '#888', textAlign: 'center' }}>{subItem.duration}</span>
                    <span style={{ textAlign: 'right' }}>{subItem.start} - {subItem.end}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="App"
      style={{
        backgroundColor: 'black',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          marginBottom: '20px',
          padding: '10px',
          borderBottom: '1px solid white',
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        <button
          onClick={() => setCurrentSection('userinfo')}
          style={{
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: currentSection === 'userinfo' ? 'white' : 'black',
            color: currentSection === 'userinfo' ? 'black' : 'white',
            cursor: 'pointer',
            fontWeight: currentSection === 'userinfo' ? 'bold' : 'normal',
          }}
        >
          User Info
        </button>
        {sessionId && (
          <>
            <button
              onClick={() => setCurrentSection('problemdefinition')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'problemdefinition' ? 'white' : 'black',
                color: currentSection === 'problemdefinition' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'problemdefinition' ? 'bold' : 'normal',
              }}
            >
              Problem Definition
            </button>
            <button
              onClick={() => setCurrentSection('mvpplanner')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'mvpplanner' ? 'white' : 'black',
                color: currentSection === 'mvpplanner' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'mvpplanner' ? 'bold' : 'normal',
              }}
            >
              MVP Planner
            </button>
            <button
              onClick={() => setCurrentSection('givegetfeedback')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'givegetfeedback' ? 'white' : 'black',
                color: currentSection === 'givegetfeedback' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'givegetfeedback' ? 'bold' : 'normal',
              }}
            >
              Give & Get Feedback
            </button>
            <button
              onClick={() => setCurrentSection('refineyourmvp')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'refineyourmvp' ? 'white' : 'black',
                color: currentSection === 'refineyourmvp' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'refineyourmvp' ? 'bold' : 'normal',
              }}
            >
              Refine Your MVP
            </button>
            <button
              onClick={() => setCurrentSection('startbuild')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'startbuild' ? 'white' : 'black',
                color: currentSection === 'startbuild' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'startbuild' ? 'bold' : 'normal',
              }}
            >
              Start Build
            </button>
            <button
              onClick={() => setCurrentSection('presentationsretro')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'presentationsretro' ? 'white' : 'black',
                color: currentSection === 'presentationsretro' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'presentationsretro' ? 'bold' : 'normal',
              }}
            >
              Presentations & Retro
            </button>
            <button
              onClick={() => setCurrentSection('videoreflection')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'videoreflection' ? 'white' : 'black',
                color: currentSection === 'videoreflection' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'videoreflection' ? 'bold' : 'normal',
              }}
            >
              Video Reflection
            </button>
            <button
              onClick={() => setCurrentSection('review')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'review' ? 'white' : 'black',
                color: currentSection === 'review' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'review' ? 'bold' : 'normal',
              }}
            >
              Review
            </button>
          </>
        )}
      </div>

      {saving && <p>Saving...</p>}

      {currentSection === 'userinfo' && (
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <form
            onSubmit={handleUserInfoSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              marginBottom: '20px',
              padding: '20px',
              border: '1px solid white',
              borderRadius: '8px',
            }}
          >
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={handleNameChange}
              style={{
                marginBottom: '10px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid white',
                backgroundColor: 'black',
                color: 'white',
              }}
            />

            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              style={{
                marginBottom: '10px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid white',
                backgroundColor: 'black',
                color: 'white',
              }}
            />

            <button
              type="submit"
              style={{
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'white',
                color: 'black',
                cursor: 'pointer',
              }}
            >
              Submit
            </button>
          </form>

          {renderSchedule()}
        </div>
      )}

      {currentSection === 'problemdefinition' && (
        <ProblemDefinition onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'mvpplanner' && (
        <MVPPlanner onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'givegetfeedback' && (
        <GiveGetFeedback onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'refineyourmvp' && (
        <RefineYourMVP onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'startbuild' && (
        <StartBuild onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'presentationsretro' && (
        <PresentationsRetro onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'videoreflection' && (
        <VideoReflection sessionId={sessionId} />
      )}

      {currentSection === 'review' && (
        <div style={{ width: '80%', maxWidth: '800px' }}>
          <h2>Review Your Answers</h2>
          {reviewLoading ? (
            <p>Loading review data...</p>
          ) : (
            <>
              {generateAISummary(userInputs)}
              {userInputs.map((input) => (
                <div key={input.id} style={{ marginBottom: '20px', border: '1px solid white', padding: '20px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>{input.section_name}</h3>
                    <button
                      onClick={() => handleEdit(input.section_name)}
                      style={{
                        padding: '5px 15px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'white',
                        color: 'black',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <div style={{ lineHeight: '1.6' }}>
                    {formatSectionData(input.section_name, input.input_data)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default BuilderView;