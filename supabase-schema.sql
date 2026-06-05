-- ================================================================
-- JoinIn · People Intelligence Platform
-- Execute este SQL no Supabase SQL Editor
-- ================================================================

-- Profiles (extensão do auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Gestores
CREATE TABLE IF NOT EXISTS gestores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  cargo       TEXT,
  area        TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  cargo       TEXT NOT NULL,
  area        TEXT NOT NULL,
  gestor_id   UUID REFERENCES gestores(id) ON DELETE SET NULL,
  admissao    DATE NOT NULL,
  modalidade  TEXT DEFAULT 'Presencial',
  email       TEXT,
  status      TEXT DEFAULT 'ativo',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Checkins
CREATE TABLE IF NOT EXISTS checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  colaborador_id  UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data            DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Termômetros (0-10)
  score_onb       NUMERIC(4,1),
  score_integ     NUMERIC(4,1),
  score_dem       NUMERIC(4,1),
  score_trei      NUMERIC(4,1),
  score_tools     NUMERIC(4,1),
  score_lider     NUMERIC(4,1),
  score_bem       NUMERIC(4,1),
  score_pert      NUMERIC(4,1),
  score_cult      NUMERIC(4,1),

  -- Emojis (índice 0-4)
  emoji_acolhido  SMALLINT,
  emoji_perdido   SMALLINT,
  emoji_pronto    SMALLINT,
  emoji_seguro    SMALLINT,
  emoji_orgulho   SMALLINT,

  -- Escalas cultura
  cv2_scale       SMALLINT,
  cv6_scale       SMALLINT,

  -- NPS
  nps             SMALLINT CHECK (nps BETWEEN 0 AND 10),

  -- Qualitativo (texto)
  q1  TEXT, q2  TEXT, q3  TEXT, q4  TEXT,
  q5  TEXT, q6  TEXT, q7  TEXT,
  cv1 TEXT, cv3 TEXT, cv4 TEXT, cv5 TEXT,
  cv7 TEXT, cv8 TEXT, cv9 TEXT, cv10 TEXT,
  e1  TEXT, e2  TEXT, e3  TEXT, e4  TEXT,
  s1  TEXT, s2  TEXT, s3  TEXT,

  -- Tags selecionadas
  tags            TEXT[] DEFAULT '{}',

  -- NR-1
  nr1_sobrecarga  TEXT DEFAULT 'baixo',
  nr1_suporte     TEXT DEFAULT 'baixo',
  nr1_conflitos   TEXT DEFAULT 'baixo',
  nr1_pressao     TEXT DEFAULT 'baixo',
  nr1_clareza     TEXT DEFAULT 'baixo',
  nr1_isolamento  TEXT DEFAULT 'baixo',
  nr1_seguranca   TEXT DEFAULT 'baixo',

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_colaboradores_user   ON colaboradores(user_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_gestor ON colaboradores(gestor_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user        ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_colab       ON checkins(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_checkins_data        ON checkins(data DESC);
CREATE INDEX IF NOT EXISTS idx_gestores_user        ON gestores(user_id);

-- Row Level Security
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins      ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuário acessa apenas seus próprios dados
CREATE POLICY "profiles_own"      ON profiles      FOR ALL USING (auth.uid() = id);
CREATE POLICY "gestores_own"      ON gestores      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "colaboradores_own" ON colaboradores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "checkins_own"      ON checkins      FOR ALL USING (auth.uid() = user_id);

-- Trigger: criar profile automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
