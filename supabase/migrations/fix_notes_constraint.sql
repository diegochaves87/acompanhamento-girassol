-- Remove check constraint on context_type to allow 'nota_interna'
ALTER TABLE multidisciplinary_notes
  DROP CONSTRAINT IF EXISTS multidisciplinary_notes_context_type_check;

ALTER TABLE multidisciplinary_notes
  DROP CONSTRAINT IF EXISTS chk_context_type;

-- Re-add constraint that includes nota_interna
ALTER TABLE multidisciplinary_notes
  ADD CONSTRAINT multidisciplinary_notes_context_type_check
  CHECK (context_type IN (
    'session_note',
    'prescription',
    'referral',
    'evaluation',
    'multidisciplinary',
    'nota_interna',
    'other'
  ));
