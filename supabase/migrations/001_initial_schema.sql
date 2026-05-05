-- ============================================================
-- Migration: 001_initial_schema
-- Descrição: Schema inicial do Crypto Portfolio
-- Criado para: Supabase (PostgreSQL 15+)
-- ============================================================

-- Habilita extensões úteis
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Tabela: users
-- Armazena usuários da aplicação (auth customizada com JWT)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id          BIGSERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tabela: addresses
-- Endereços de wallet vinculados a um usuário
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label       VARCHAR(100) NOT NULL,
  address     VARCHAR(255) NOT NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('evm', 'bitcoin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tabela: user_preferences
-- Preferências por usuário (moeda padrão, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  default_currency VARCHAR(10) DEFAULT 'BRL' CHECK (default_currency IN ('BRL', 'USD', 'BTC')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Índices para performance
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_addresses_user_id  ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_address  ON public.addresses(LOWER(address));

-- ------------------------------------------------------------
-- Trigger: atualiza updated_at automaticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
