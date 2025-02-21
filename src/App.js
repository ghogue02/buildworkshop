import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import ProblemDefinition from './ProblemDefinition';
import AISolutionPlanner from './AISolutionPlanner';
import ShareFeedback from './ShareFeedback';
import RefineIdea from './RefineIdea';
import StartBuild from './StartBuild';
import PresentationsRetro from './PresentationsRetro';

function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentSection, setCurrentSection] = useState('userinfo');
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [userInputs, setUserInputs] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isMounted = useRef(true);

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
      case 'AI Solution Planner':
        return (
          <div>
            <p><strong>AI Options:</strong></p>
            <ul>
              {data.aiOptions.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
            <p><strong>How It Works:</strong> {data.howItWorks}</p>
            <p><strong>Data Needs:</strong> {data.dataNeeds}</p>
            <p><strong>User Experience:</strong> {data.userExperience}</p>
            <p><strong>Value Proposition:</strong> {data.valueProposition}</p>
          </div>
        );
      case 'Share Feedback':
        return (
          <div>
            <p><strong>Share:</strong> {data.share}</p>
            <p><strong>Request Feedback:</strong> {data.requestFeedback}</p>
            <p><strong>Give Feedback:</strong> {data.giveFeedback}</p>
            <p><strong>Capture:</strong> {data.capture}</p>
          </div>
        );
      case 'Refine Idea':
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
            <p><strong>Setup & Planning:</strong> {data.setup}</p>
            <p><strong>Core Functionality:</strong> {data.core}</p>
            <p><strong>User Experience:</strong> {data.ux}</p>
            <p><strong>Testing & Refinement:</strong> {data.testing}</p>
            <p><strong>Final Touches:</strong> {data.finalTouches}</p>
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
      const { data, error } = await supabase
        .from('user_inputs')
        .select('*')
        .eq('session_id', sessionId);

      if (error) {
        throw error;
      }

      if (data && isMounted.current) {
        console.log('Data fetched from Supabase:', data);
        setUserInputs(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      if (isMounted.current) {
        setReviewLoading(false);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    // Load name and email from local storage on component mount
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    if (storedName) setName(storedName);
    if (storedEmail) setEmail(storedEmail);

    // Generate or retrieve session ID
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

  // Fetch data when entering review section
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
      return;
    }

    // Save to local storage
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);

    setSaving(true);
    try {
      console.log('Saving user info:', {
        session_id: sessionId,
        name,
        email
      });

      const { error } = await supabase
        .from('user_inputs')
        .upsert({
          session_id: sessionId,
          section_name: 'User Info',
          input_data: { name, email }
        });

      if (error) {
        throw error;
      }

      console.log('User info saved successfully');
      alert('Your information has been saved!');
      setCurrentSection('problemdefinition');
    } catch (error) {
      console.error('Error saving data:', error.message);
      alert('Error saving data: ' + error.message);
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  };

  const handleSectionSave = useCallback(
    async (sectionName, sectionData) => {
      if (!sessionId) return;

      setSaving(true);
      try {
        console.log('Saving section data:', {
          session_id: sessionId,
          section_name: sectionName,
          data: sectionData
        });

        const { error } = await supabase
          .from('user_inputs')
          .upsert({
            session_id: sessionId,
            section_name: sectionName,
            input_data: sectionData
          });

        if (error) {
          throw error;
        }

        console.log('Section data saved successfully');
        setCurrentSection(getNextSection(sectionName));
      } catch (error) {
        console.error('Error saving data:', error.message);
        alert('Error saving data: ' + error.message);
      } finally {
        if (isMounted.current) {
          setSaving(false);
        }
      }
    },
    [sessionId]
  );

  const getNextSection = useCallback((sectionName) => {
    switch (sectionName) {
      case 'Problem Definition':
        return 'aisolutionplanner';
      case 'AI Solution Planner':
        return 'sharefeedback';
      case 'Share Feedback':
        return 'refineidea';
      case 'Refine Idea':
        return 'startbuild';
      case 'Start Build':
        return 'presentationsretro';
      case 'Presentations & Retro':
        return 'review';
      default:
        return 'userinfo';
    }
  }, []);

  const handleEdit = (sectionName) => {
    setCurrentSection(sectionName.toLowerCase().replace(/\s+/g, ''));
  };

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
              onClick={() => setCurrentSection('aisolutionplanner')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'aisolutionplanner' ? 'white' : 'black',
                color: currentSection === 'aisolutionplanner' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'aisolutionplanner' ? 'bold' : 'normal',
              }}
            >
              AI Solution Planner
            </button>
            <button
              onClick={() => setCurrentSection('sharefeedback')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'sharefeedback' ? 'white' : 'black',
                color: currentSection === 'sharefeedback' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'sharefeedback' ? 'bold' : 'normal',
              }}
            >
              Share Feedback
            </button>
            <button
              onClick={() => setCurrentSection('refineidea')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentSection === 'refineidea' ? 'white' : 'black',
                color: currentSection === 'refineidea' ? 'black' : 'white',
                cursor: 'pointer',
                fontWeight: currentSection === 'refineidea' ? 'bold' : 'normal',
              }}
            >
              Refine Idea
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
        <form
          onSubmit={handleUserInfoSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '300px',
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
      )}

      {currentSection === 'problemdefinition' && (
        <ProblemDefinition onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'aisolutionplanner' && (
        <AISolutionPlanner onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'sharefeedback' && (
        <ShareFeedback onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'refineidea' && (
        <RefineIdea onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'startbuild' && (
        <StartBuild onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'presentationsretro' && (
        <PresentationsRetro onSave={handleSectionSave} sessionId={sessionId} />
      )}

      {currentSection === 'review' && (
        <div style={{ width: '80%', maxWidth: '800px' }}>
          <h2>Review Your Answers</h2>
          {reviewLoading ? (
            <p>Loading review data...</p>
          ) : (
            userInputs.map((input) => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
