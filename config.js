/* Підключення до Supabase — для сайту й адмінки.
   Обидва значення ПУБЛІЧНІ за призначенням: Supabase → Project Settings → API →
   «Project URL» і «anon public» (або «publishable») key.
   Дані захищає не секретність ключа, а правила RLS у базі (soko-build/supabase/schema.sql).
   НІКОЛИ не вставляй сюди service_role / secret key — він обходить усі правила. */
window.SOKO_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
