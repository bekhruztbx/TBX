/* ===================== TBX — SUPABASE INTEGRATION =====================
  Real backend for accounts (replaces the plaintext localStorage demo auth
  in tbx-account.js). Requires supabase-js.min.js to be loaded first.

  SOZLASH:
  1. supabase.com → loyiha yaratildi (bajarilgan)
  2. Settings → API → Project URL va Publishable key quyida to'ldirilgan
  3. Authentication → Providers → Google ni yoqsangiz, "Continue with Google"
     tugmasi qo'shimcha kod o'zgarishisiz ishlay boshlaydi.
  4. Authentication → Email templates: standart Supabase email tasdiqlash/parol
     tiklash xatlari ishlaydi (bepul, hech narsa sozlash shart emas).
======================================================================= */

const SUPABASE_URL = 'https://srsqqlcefckenpnedxzr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mKNPHIHYlmoQZpB0VFbunQ_PQDXFIh7';

/* ------------------------------------------------------------------ */
const SUPABASE_ENABLED = !SUPABASE_URL.includes('YOUR_PROJECT') && typeof window.supabase !== 'undefined';
const client = SUPABASE_ENABLED ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

async function sbSignUp({ email, password, firstName, lastName, phone }) {
  const { data, error } = await client.auth.signUp({
    email, password,
    options: {
      data: { first_name: firstName, last_name: lastName, phone: phone || null },
      emailRedirectTo: window.location.origin + '/account.html?confirmed=1',
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

async function sbSignIn({ email, password }) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

async function sbSignOut() {
  if (client) await client.auth.signOut();
}

async function sbGetSession() {
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

async function sbGetProfile(userId) {
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

async function sbUpdateProfile(userId, fields) {
  const { error } = await client.from('profiles').update(fields).eq('id', userId);
  if (error) throw new Error(error.message);
}

async function sbSignInWithGoogle() {
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/account-dashboard.html' },
  });
  if (error) throw new Error(error.message);
}

async function sbResetPasswordForEmail(email) {
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/account-forgot.html',
  });
  if (error) throw new Error(error.message);
}

async function sbUpdatePassword(newPassword) {
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

window.TBXSupabase = {
  SUPABASE_ENABLED,
  client,
  sbSignUp,
  sbSignIn,
  sbSignOut,
  sbGetSession,
  sbGetProfile,
  sbUpdateProfile,
  sbSignInWithGoogle,
  sbResetPasswordForEmail,
  sbUpdatePassword,
};
