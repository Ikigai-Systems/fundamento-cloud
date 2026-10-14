# Auditing

`ApplicationRecord` calls `audited`, so **every model is audited by default** and must opt out
explicitly.

**`audited enabled: false` does nothing.** In audited 5.8.0 `set_audited_options` never reads
`:enabled`, and `auditing_enabled` resolves through
`Audited.store.fetch("#{table_name}_auditing_enabled", true)`. The declaration reads as an opt-out
and is inert: seven models once carried it while writing an audit row per write (`Tables::Cell` on
every cell edit, storing the changed value a second time).

Use **`ApplicationRecord.skip_auditing`**, which overrides the class method `write_audit` actually
consults.

Test auditing behaviourally ("writes no audit records"), never by asserting on `auditing_enabled`
or `non_audited_columns`. The class-level reader returns `true` even for models that have opted
out, so an assertion on it passes while the model still audits.
