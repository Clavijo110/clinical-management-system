(async function(){
  try {
    const res = await fetch('https://shhwkarwdfsdfdmvhazt.supabase.co');
    console.log('OK', res.status);
  } catch (e) {
    console.error('ERR', e.message);
  }
})();
