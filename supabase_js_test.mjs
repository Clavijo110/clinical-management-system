import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://shhwkarwdfsdfdmvhazt.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaHdrYXJ3ZGZzZGZkbXZoYXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMzk1MjMsImV4cCI6MjA5MDkxNTUyM30.zfvjdOW3UvG2yZgubh6VVOyYIjTYsPpDlq2Eb_hPtHY");
(async()=>{
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: 'test@example.com', password: 'test1234' });
    console.log('DATA', data);
    console.log('ERROR', error);
  } catch (e) {
    console.error('EX', e.message);
  }
})();
