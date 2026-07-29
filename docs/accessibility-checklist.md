# Accessibility and human-factors checklist

## Implemented and code-reviewed

- [x] Semantic `nav`, `main`, `header`, `footer`, headings, lists, buttons, definition lists, and tables.
- [x] Skip link to main content.
- [x] Keyboard-operable navigation, filters, expanders, permission controls, and demo actions.
- [x] Visible high-contrast focus outline.
- [x] Buttons have programmatic names; icon-only buttons have `aria-label`.
- [x] Expandable commitment rows expose `aria-expanded`.
- [x] Current navigation exposes `aria-current="page"`.
- [x] Status includes text and symbols; color is not the only signal.
- [x] Touch targets are generally 39–44 pixels high.
- [x] Responsive layouts for desktop, tablet, and narrow mobile.
- [x] Relative text sizing and no fixed viewport lock.
- [x] Reduced-motion media query.
- [x] Print stylesheet for the daily mission and evidence.
- [x] Text transcript represented as an alternative to the synthetic voice note.
- [x] Plain-language error and safety-stop content.
- [x] One-primary-action Today screen and grouped nonurgent updates.
- [x] No animation required to understand state.

## Verification still required

- [ ] Independent WCAG 2.2 AA audit with assistive technology users.
- [ ] Automated axe scan in CI.
- [ ] Screen-reader testing with NVDA, JAWS, VoiceOver, and TalkBack.
- [ ] Keyboard test on every supported browser.
- [ ] 200% and 400% zoom verification.
- [ ] Contrast measurement for every component state.
- [ ] Cognitive walkthrough with stressed and interrupted caregivers.
- [ ] Hearing, motor, vision, cognitive, and low-literacy subgroup testing.
- [ ] Low-bandwidth and offline-resumption validation.
- [ ] Plain-language review with care recipients.

Passing code review and a responsive build is not equivalent to Section 508 or WCAG certification.
