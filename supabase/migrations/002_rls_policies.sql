-- ============================================================
-- Migration: 002_rls_policies
-- Descrição: Row Level Security para as tabelas do portfólio
-- IMPORTANTE: Esta app usa JWT customizado (não Supabase Auth).
--   As políticas abaixo usam service_role (bypass RLS) no server.
--   RLS aqui é uma camada extra de segurança caso a service_role
--   key seja usada indevidamente. Ajuste conforme necessário.
-- ============================================================

-- Habilita RLS nas tabelas
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Políticas para service_role (usado pelo backend Vercel)
-- service_role bypassa RLS por padrão no Supabase,
-- mas definimos explicitamente para clareza.
-- ------------------------------------------------------------

-- users: service_role tem acesso total
CREATE POLICY "service_role_full_access_users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- addresses: service_role tem acesso total
CREATE POLICY "service_role_full_access_addresses"
  ON public.addresses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- user_preferences: service_role tem acesso total
CREATE POLICY "service_role_full_access_preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- Bloqueia acesso anon e authenticated (JWT do Supabase) pois
-- esta app usa JWT próprio — toda autenticação passa pelo backend.
-- ------------------------------------------------------------
CREATE POLICY "deny_anon_users"
  ON public.users
  FOR ALL
  TO anon, authenticated
  USING (false);

CREATE POLICY "deny_anon_addresses"
  ON public.addresses
  FOR ALL
  TO anon, authenticated
  USING (false);

CREATE POLICY "deny_anon_preferences"
  ON public.user_preferences
  FOR ALL
  TO anon, authenticated
  USING (false);
