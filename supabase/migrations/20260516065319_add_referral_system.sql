-- Add referral columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code          text        UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_bonus_ends_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_referral_code_idx
  ON profiles(referral_code)
  WHERE referral_code IS NOT NULL;

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id   uuid        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  rewarded_at  timestamptz
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_referrals"
  ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referee_id_idx  ON referrals(referee_id);
