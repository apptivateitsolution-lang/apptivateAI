import React, { useState, useEffect } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple persisted profile (keeps original behavior)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('apptivate_profile');
      return saved ? JSON.parse(saved) : { companyName: 'Apptivate It Solution', services: 'Website Development, SEO, Digital Marketing, IT Hardware', website: '', instagram: '', gmb: '', location: 'Surat, Gujarat' };
    } catch (e) {
      return { companyName: 'Apptivate It Solution', services: 'Website Development, SEO, Digital Marketing, IT Hardware', website: '', instagram: '', gmb: '', location: 'Surat, Gujarat' };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('apptivate_profile', JSON.stringify(profile));
    } catch (e) { /* ignore */ }
  }, [profile]);

  async function sendPrompt(e) {
    e?.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) {
        setResponse('Error: ' + (data?.error || JSON.stringify(data)));
      } else {
        setResponse(data.text || JSON.stringify(data));
      }
    } catch (err) {
      setResponse('Request failed: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1>Apptivate AI Marketing — Personal Edition</h1>

      <section style={{ marginBottom: 20 }}>
        <h2>Company Profile</h2>
        <input placeholder='Company name' value={profile.companyName} onChange={(e)=>setProfile({...profile, companyName: e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
        <input placeholder='Services' value={profile.services} onChange={(e)=>setProfile({...profile, services: e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
        <small>Location: {profile.location}</small>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2>Send Prompt to AI</h2>
        <form onSubmit={sendPrompt}>
          <textarea placeholder='Enter a prompt (e.g. "Give me 5 Instagram captions for a coffee shop")' value={prompt} onChange={(e)=>setPrompt(e.target.value)} style={{width:'100%',height:120,padding:8}} />
          <div style={{marginTop:8}}>
            <button type='submit' disabled={loading} style={{padding:'8px 16px'}}>{loading ? 'Generating...' : 'Generate'}</button>
            <button type='button' onClick={()=>{setPrompt(''); setResponse('');}} style={{marginLeft:8}}>Clear</button>
          </div>
        </form>
      </section>

      <section>
        <h2>AI Output</h2>
        <div style={{whiteSpace:'pre-wrap', background:'#f7f7f7', padding:12, minHeight:80}}>
          {response || <em>AI response will appear here</em>}
        </div>
      </section>
    </div>
  );
}
