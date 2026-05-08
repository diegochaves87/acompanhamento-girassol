-- Permite email nulo em family_access (familiar pode completar e-mail ao aceitar o convite)
ALTER TABLE family_access ALTER COLUMN email DROP NOT NULL;
