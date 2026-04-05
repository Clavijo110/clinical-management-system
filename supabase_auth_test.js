(async function(){
  try {
    const res = await fetch('https://shhwkarwdfsdfdmvhazt.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaHdrYXJ3ZGZzZGZkbXZoYXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMzk1MjMsImV4cCI6MjA5MDkxNTUyM30.zfvjdOW3UvG2yGubh6VVOyYIjTYsPpDlq2Eb_hPtHY'
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'test' })
    });
    console.log('STATUS', res.status);
    const body = await res.text();
    console.log('BODY', body);
  } catch (e) {
    console.error('ERR', e.message);
  }
})();
