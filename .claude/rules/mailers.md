# Mailers

Every mail uses one layout, `app/views/layouts/mailer.html.erb`. A template holds only its
content: an `h1`, `p` (and `p.muted` for the small grey note) and `email_button`. The layout's
`<style>` block carries the look, and `premailer-rails` inlines it into the elements at delivery,
so a template needs no inline styles and no table markup of its own.

- **Buttons:** `email_button(text, url)` (`MailerHelper`, partial `app/views/mailer/_button.html.erb`).
  The colour sits on the table cell because Outlook ignores a background on the link. Don't write
  a button by hand.
- **Logo:** `ApplicationMailer` attaches it inline with a `before_action`, and the layout reads
  `attachments["logo.png"]`. A mailer that skips the callback renders a broken image. Devise's
  `parent_mailer` is `ApplicationMailer`, so Devise mails inherit all of this.
- **Text part:** don't hand-write `.text.erb`. `premailer-rails` generates it from the HTML when
  none exists, and a hand-written copy drifts from the HTML (two did, with a stale year).
- **Mail clients:** keep to tables for layout, no web fonts, no CSS the major clients drop
  (flexbox, grid, `position`). A new `@media` rule goes in the layout's `<style>` block;
  premailer keeps it as a style tag instead of inlining it.

## Previews and the preview spec

Previews live in `spec/mailers/previews/`, not Rails' default `test/`; `config/application.rb`
points `preview_paths` there. Open `/rails/mailers` in `bin/dev`.

`spec/mailers/mailer_previews_spec.rb` renders every preview and checks the html and text parts,
inlined styles, logo, alt text and absolute links. **A new mail needs a preview.** Add its name to
the "covers every Devise mail we ship" list too, or the spec fails.

A preview must work on bare development data: seeds have no public links, so
`PublicLinkMailerPreview` builds an unsaved one when none exists. Use an unsaved record whenever
the mail only reads attributes (the unlock mail previews with an unsaved `Superintendent`).

## What the specs can't tell you

Nothing here checks how Outlook, Gmail or Apple Mail render a mail. After changing the layout or
the button, send each mail once through the SMTP sandbox and look at it in those clients.
