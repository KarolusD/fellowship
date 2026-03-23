---
name: accessibility
description: WCAG 2.2 audit patterns, screen reader testing (VoiceOver, NVDA, JAWS, TalkBack), ARIA remediation, and automated testing. Use when auditing for accessibility, fixing WCAG violations, or implementing accessible components.
---

# Accessibility

Comprehensive reference for WCAG 2.2 auditing, screen reader testing, ARIA remediation, and automated tooling.

---

## 1. Core Concepts

### POUR Principles

```
Perceivable:    Can users perceive the content? (alt text, captions, contrast)
Operable:       Can users operate the interface? (keyboard nav, timing, seizures)
Understandable: Can users understand it? (language, labels, errors)
Robust:         Does it work with assistive technology? (ARIA, semantic HTML)
```

### Conformance Levels

| Level | Description | Required For |
|-------|-------------|--------------|
| **A** | Minimum accessibility | Legal baseline |
| **AA** | Standard conformance | Most regulations — target this |
| **AAA** | Enhanced accessibility | Specialized contexts only |

### Common Violations by Impact

```
Critical (Blockers):
├── Missing alt text for functional images
├── No keyboard access to interactive elements
├── Missing form labels
└── Auto-playing media without controls

Serious:
├── Insufficient color contrast
├── Missing skip links
├── Inaccessible custom widgets
└── Missing page titles

Moderate:
├── Missing language attribute
├── Unclear link text
├── Missing landmarks
└── Improper heading hierarchy
```

---

## 2. WCAG 2.2 Audit Checklist

### Perceivable (Principle 1)

#### 1.1 Text Alternatives

**1.1.1 Non-text Content (Level A)**
- [ ] All images have alt text
- [ ] Decorative images have `alt=""`
- [ ] Complex images have long descriptions
- [ ] Icons with meaning have accessible names
- [ ] CAPTCHAs have alternatives

```html
<!-- Good -->
<img src="chart.png" alt="Sales increased 25% from Q1 to Q2" />
<img src="decorative-line.png" alt="" />

<!-- Bad -->
<img src="chart.png" />
<img src="decorative-line.png" alt="decorative line" />
```

#### 1.2 Time-based Media

**1.2.1 Audio-only and Video-only (Level A)**
- [ ] Audio has text transcript
- [ ] Video has audio description or transcript

**1.2.2 Captions (Level A)**
- [ ] All video has synchronized captions
- [ ] Captions are accurate, complete, with speaker identification

**1.2.3 Audio Description (Level A)**
- [ ] Video has audio description for visual content

#### 1.3 Adaptable

**1.3.1 Info and Relationships (Level A)**
- [ ] Headings use proper tags (h1–h6)
- [ ] Lists use `ul`/`ol`/`dl`
- [ ] Tables have headers
- [ ] Form inputs have labels
- [ ] ARIA landmarks present

```html
<!-- Heading hierarchy -->
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<h2>Another Section</h2>

<!-- Table headers -->
<table>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Price</th>
    </tr>
  </thead>
</table>
```

**1.3.2 Meaningful Sequence (Level A)**
- [ ] Reading order is logical
- [ ] CSS positioning doesn't break order
- [ ] Focus order matches visual order

**1.3.3 Sensory Characteristics (Level A)**
- [ ] Instructions don't rely on shape/color alone
- [ ] "Click the red button" → "Click Submit (red button)"

#### 1.4 Distinguishable

**1.4.1 Use of Color (Level A)**
- [ ] Color is not the only means of conveying info
- [ ] Links distinguishable without color
- [ ] Error states not color-only

**1.4.3 Contrast Minimum (Level AA)**
- [ ] Text: 4.5:1 contrast ratio
- [ ] Large text (18pt+ or 14pt bold): 3:1 ratio
- [ ] UI components: 3:1 ratio

Tools: WebAIM Contrast Checker, axe DevTools

**1.4.4 Resize Text (Level AA)**
- [ ] Text resizes to 200% without loss
- [ ] No horizontal scrolling at 320px
- [ ] Content reflows properly

**1.4.10 Reflow (Level AA)**
- [ ] Content reflows at 400% zoom
- [ ] No two-dimensional scrolling
- [ ] All content accessible at 320px width

**1.4.11 Non-text Contrast (Level AA)**
- [ ] UI components have 3:1 contrast
- [ ] Focus indicators visible
- [ ] Graphical objects distinguishable

**1.4.12 Text Spacing (Level AA)**
- [ ] No content loss with increased spacing
- [ ] Line height 1.5x font size
- [ ] Paragraph spacing 2x font size
- [ ] Letter spacing 0.12x font size
- [ ] Word spacing 0.16x font size

---

### Operable (Principle 2)

#### 2.1 Keyboard Accessible

**2.1.1 Keyboard (Level A)**
- [ ] All functionality keyboard accessible
- [ ] No keyboard traps
- [ ] Tab order is logical
- [ ] Custom widgets are keyboard operable

```html
<!-- Custom button must be keyboard accessible -->
<div role="button" tabindex="0"
     onkeydown="if(event.key === 'Enter' || event.key === ' ') activate()">
  Action
</div>
```

**2.1.2 No Keyboard Trap (Level A)**
- [ ] Focus can move away from all components
- [ ] Modal dialogs trap focus correctly
- [ ] Focus returns after modal closes

#### 2.2 Enough Time

**2.2.1 Timing Adjustable (Level A)**
- [ ] Session timeouts can be extended
- [ ] User warned before timeout
- [ ] Option to disable auto-refresh

**2.2.2 Pause, Stop, Hide (Level A)**
- [ ] Moving content can be paused
- [ ] Auto-updating content can be paused
- [ ] Animations respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

#### 2.3 Seizures and Physical Reactions

**2.3.1 Three Flashes (Level A)**
- [ ] No content flashes more than 3 times/second
- [ ] Flashing area is small (<25% viewport)

#### 2.4 Navigable

**2.4.1 Bypass Blocks (Level A)**
- [ ] Skip to main content link present
- [ ] Landmark regions defined
- [ ] Proper heading structure

```html
<a href="#main" class="skip-link">Skip to main content</a>
<main id="main">...</main>
```

**2.4.2 Page Titled (Level A)**
- [ ] Unique, descriptive page titles
- [ ] Title reflects page content

**2.4.3 Focus Order (Level A)**
- [ ] Focus order matches visual order
- [ ] `tabindex` used correctly (avoid positive integers)

**2.4.4 Link Purpose (Level A)**
- [ ] Links make sense out of context
- [ ] No "click here" or "read more" alone

```html
<!-- Bad -->
<a href="report.pdf">Click here</a>

<!-- Good -->
<a href="report.pdf">Download Q4 Sales Report (PDF)</a>
```

**2.4.6 Headings and Labels (Level AA)**
- [ ] Headings describe content
- [ ] Labels describe purpose

**2.4.7 Focus Visible (Level AA)**
- [ ] Focus indicator visible on all elements
- [ ] Custom focus styles meet 3:1 contrast

```css
:focus {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
}
```

**2.4.11 Focus Not Obscured (Level AA) — WCAG 2.2**
- [ ] Focused element not fully hidden behind sticky headers
- [ ] Sticky headers account for focus indicator position

---

### Understandable (Principle 3)

#### 3.1 Readable

**3.1.1 Language of Page (Level A)**
- [ ] HTML `lang` attribute set and correct

```html
<html lang="en">
```

**3.1.2 Language of Parts (Level AA)**
- [ ] Language changes marked with `lang` attribute

```html
<p>The French word <span lang="fr">bonjour</span> means hello.</p>
```

#### 3.2 Predictable

**3.2.1 On Focus (Level A)**
- [ ] No context change on focus alone
- [ ] No unexpected popups on focus

**3.2.2 On Input (Level A)**
- [ ] No automatic form submission
- [ ] User warned before context change

**3.2.3 Consistent Navigation (Level AA)**
- [ ] Navigation consistent across pages
- [ ] Repeated components in same order

**3.2.4 Consistent Identification (Level AA)**
- [ ] Same functionality has same label
- [ ] Icons used consistently

#### 3.3 Input Assistance

**3.3.1 Error Identification (Level A)**
- [ ] Errors clearly identified
- [ ] Error message describes the problem
- [ ] Error linked to the field

```html
<input aria-describedby="email-error" aria-invalid="true" />
<span id="email-error" role="alert">Please enter a valid email address</span>
```

**3.3.2 Labels or Instructions (Level A)**
- [ ] All inputs have visible labels
- [ ] Required fields indicated
- [ ] Format hints provided

**3.3.3 Error Suggestion (Level AA)**
- [ ] Errors include specific correction suggestion

**3.3.4 Error Prevention (Level AA)**
- [ ] Legal/financial forms reversible
- [ ] Data checked before submission
- [ ] User can review before submit

---

### Robust (Principle 4)

#### 4.1 Compatible

**4.1.1 Parsing (Level A) — Obsolete in WCAG 2.2**
- [ ] Valid HTML (good practice regardless)
- [ ] No duplicate IDs
- [ ] Complete start/end tags

**4.1.2 Name, Role, Value (Level A)**
- [ ] Custom widgets have accessible names
- [ ] ARIA roles are correct
- [ ] State changes are announced

```html
<!-- Accessible custom checkbox -->
<div role="checkbox"
     aria-checked="false"
     tabindex="0"
     aria-labelledby="label">
</div>
<span id="label">Accept terms</span>
```

**4.1.3 Status Messages (Level AA)**
- [ ] Status updates announced via live regions
- [ ] Live regions used correctly (polite vs. assertive)

```html
<div role="status" aria-live="polite">3 items added to cart</div>
<div role="alert" aria-live="assertive">Error: Form submission failed</div>
```

---

## 3. Screen Reader Testing

### Screen Reader Coverage

| Screen Reader | Platform | Browser | Usage Share |
|---------------|----------|---------|-------------|
| **VoiceOver** | macOS/iOS | Safari | ~15% |
| **NVDA** | Windows | Firefox/Chrome | ~31% |
| **JAWS** | Windows | Chrome/IE | ~40% |
| **TalkBack** | Android | Chrome | ~10% |
| **Narrator** | Windows | Edge | ~4% |

**Minimum coverage:**
1. NVDA + Firefox (Windows) — highest real-world usage
2. VoiceOver + Safari (macOS) — likely your own setup
3. VoiceOver + Safari (iOS) — mobile

**Comprehensive coverage adds:** JAWS + Chrome, TalkBack + Chrome, Narrator + Edge

### Screen Reader Modes

| Mode | Purpose | When Used |
|------|---------|-----------|
| **Browse/Virtual** | Read content | Default reading |
| **Focus/Forms** | Interact with controls | Filling forms |
| **Application** | Custom widgets | ARIA `role="application"` |

---

### VoiceOver (macOS)

**Setup:**
```
Enable: System Preferences → Accessibility → VoiceOver
Toggle: Cmd + F5
Quick Toggle: Triple-press Touch ID
```

**Essential Commands:**
```
VO modifier = Ctrl + Option

Navigation:
VO + Right Arrow    Next element
VO + Left Arrow     Previous element
VO + Shift + Down   Enter group
VO + Shift + Up     Exit group

Reading:
VO + A              Read all from cursor
Ctrl                Stop speaking
VO + B              Read current paragraph

Interaction:
VO + Space          Activate element
VO + Shift + M      Open context menu
Tab                 Next focusable element
Shift + Tab         Previous focusable element

Rotor (VO + U):
Left/Right Arrow    Change rotor category (Headings, Links, Forms, Landmarks)
Up/Down Arrow       Navigate within category
Enter               Go to item

Web Quick Nav:
VO + Cmd + H        Next heading
VO + Cmd + J        Next form control
VO + Cmd + L        Next link
VO + Cmd + T        Next table
```

**VoiceOver Testing Checklist:**

Page Load:
- [ ] Page title announced
- [ ] Main landmark found
- [ ] Skip link works

Navigation:
- [ ] All headings discoverable via rotor
- [ ] Heading levels logical (H1 → H2 → H3)
- [ ] Landmarks properly labeled
- [ ] Skip links functional

Links & Buttons:
- [ ] Link purpose clear from name alone
- [ ] Button actions described
- [ ] New window/tab announced

Forms:
- [ ] All labels read with inputs
- [ ] Required fields announced
- [ ] Error messages read
- [ ] Instructions available
- [ ] Focus moves to errors on submit

Dynamic Content:
- [ ] Alerts announced immediately
- [ ] Loading states communicated
- [ ] Content updates announced via live regions
- [ ] Modals trap focus correctly

Tables:
- [ ] Headers associated with cells
- [ ] Table navigation works (VO + Cmd + T)
- [ ] Complex tables have captions

---

### NVDA (Windows)

**Setup:**
```
Download: nvaccess.org
Start: Ctrl + Alt + N
Stop: Insert + Q
```

**Essential Commands:**
```
NVDA modifier = Insert

Navigation:
Down Arrow          Next line
Up Arrow            Previous line
Tab                 Next focusable
Shift + Tab         Previous focusable

Reading:
NVDA + Down Arrow   Say all
Ctrl                Stop speech
NVDA + Up Arrow     Current line

Headings:
H                   Next heading
Shift + H           Previous heading
1–6                 Heading level 1–6

Forms:
F                   Next form field
B                   Next button
E                   Next edit field
X                   Next checkbox
C                   Next combo box

Links:
K                   Next link
U                   Next unvisited link
V                   Next visited link

Landmarks:
D                   Next landmark
Shift + D           Previous landmark

Tables:
T                   Next table
Ctrl + Alt + Arrows Navigate cells

Elements List:
NVDA + F7           All links, headings, form fields, landmarks
```

**Browse vs. Focus Mode:**
```
NVDA automatically switches modes:
- Browse Mode: Arrow keys navigate content
- Focus Mode: Arrow keys control interactive elements

Manual switch: NVDA + Space

Watch for:
- "Browse mode" announcement when navigating
- "Focus mode" when entering form fields
- Application role forces forms mode
```

**NVDA Test Script:**

Initial Load:
1. Navigate to page, let it finish loading
2. Press Insert + Down to read all
3. Note: page title announced? Main content identified?

Landmark Navigation:
1. Press D repeatedly
2. Check: All main areas reachable? Landmarks properly labeled?

Heading Navigation:
1. Press Insert + F7 → Headings
2. Check: Logical heading structure?
3. Press H to navigate — all sections discoverable?

Form Testing:
1. Press F to find first form field
2. Check: Label read with the input?
3. Fill in invalid data, submit
4. Check: Errors announced? Focus moved to error?

Interactive Elements:
1. Tab through all interactive elements
2. Check: Each announces role and state
3. Activate buttons with Enter/Space
4. Check: Result announced?

Dynamic Content:
1. Trigger content update — change announced?
2. Open modal — focus trapped?
3. Close modal — focus returns to trigger?

---

### JAWS (Windows)

**Essential Commands:**
```
Start: Desktop shortcut or Ctrl + Alt + J
Virtual Cursor auto-enabled in browsers

Navigation:
Arrow keys          Navigate content
Tab                 Next focusable
Insert + Down       Read all
Ctrl                Stop speech

Quick Keys:
H                   Next heading
T                   Next table
F                   Next form field
B                   Next button
G                   Next graphic
L                   Next list
;                   Next landmark

Forms Mode:
Enter               Enter forms mode
Numpad +            Exit forms mode
F5                  List form fields

Lists:
Insert + F7         Link list
Insert + F6         Heading list
Insert + F5         Form field list

Tables:
Ctrl + Alt + Arrows Table cell navigation
```

---

### TalkBack (Android)

**Setup:**
```
Enable: Settings → Accessibility → TalkBack
Toggle: Hold both volume buttons 3 seconds
```

**Gestures:**
```
Explore:            Drag finger across screen
Next:               Swipe right
Previous:           Swipe left
Activate:           Double tap
Scroll:             Two finger swipe

Reading Controls (swipe up then right to cycle):
- Headings
- Links
- Controls
- Characters / Words / Lines / Paragraphs
```

---

## 4. Automated Testing

```javascript
// axe-core integration (Playwright)
const axe = require('axe-core');

async function runAccessibilityAudit(page) {
  await page.addScriptTag({ path: require.resolve('axe-core') });

  const results = await page.evaluate(async () => {
    return await axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
      }
    });
  });

  return {
    violations: results.violations,
    passes: results.passes,
    incomplete: results.incomplete
  };
}

// Playwright test
test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await runAccessibilityAudit(page);
  expect(results.violations).toHaveLength(0);
});
```

```bash
# CLI tools
npx @axe-core/cli https://example.com
npx pa11y https://example.com
lighthouse https://example.com --only-categories=accessibility
```

**Automated testing catches approximately 30–50% of accessibility issues.** Manual testing and screen reader validation are required for the rest.

---

## 5. Remediation Patterns

### Fix: Missing Form Labels

```html
<!-- Before -->
<input type="email" placeholder="Email" />

<!-- Option 1: Visible label (preferred) -->
<label for="email">Email address</label>
<input id="email" type="email" />

<!-- Option 2: aria-label (when visible label not possible) -->
<input type="email" aria-label="Email address" />

<!-- Option 3: aria-labelledby -->
<span id="email-label">Email</span>
<input type="email" aria-labelledby="email-label" />
```

### Fix: Insufficient Color Contrast

```css
/* Before: 2.5:1 contrast — fails AA */
.text { color: #767676; }

/* After: 4.5:1 contrast — passes AA */
.text { color: #595959; }
```

### Fix: Keyboard Navigation

```javascript
class AccessibleDropdown extends HTMLElement {
  connectedCallback() {
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'combobox');
    this.setAttribute('aria-expanded', 'false');

    this.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          this.toggle();
          e.preventDefault();
          break;
        case 'Escape':
          this.close();
          break;
        case 'ArrowDown':
          this.focusNext();
          e.preventDefault();
          break;
        case 'ArrowUp':
          this.focusPrevious();
          e.preventDefault();
          break;
      }
    });
  }
}
```

### Fix: Modal Focus Management

```html
<!-- Accessible modal structure -->
<div role="dialog"
     aria-modal="true"
     aria-labelledby="dialog-title"
     aria-describedby="dialog-desc">
  <h2 id="dialog-title">Confirm Delete</h2>
  <p id="dialog-desc">This action cannot be undone.</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```

```javascript
function openModal(modal) {
  lastFocus = document.activeElement;
  modal.querySelector('h2').focus();
  modal.addEventListener('keydown', trapFocus);
}

function closeModal(modal) {
  lastFocus.focus();
}

function trapFocus(e) {
  if (e.key === 'Tab') {
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
  if (e.key === 'Escape') closeModal(modal);
}
```

### Fix: Live Regions

```html
<!-- Status messages (polite — announces after current speech) -->
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- Updates announced politely -->
</div>

<!-- Alerts (assertive — interrupts current speech) -->
<div role="alert" aria-live="assertive">
  <!-- Updates interrupt immediately -->
</div>

<!-- Progress bar -->
<div role="progressbar"
     aria-valuenow="75"
     aria-valuemin="0"
     aria-valuemax="100"
     aria-label="Upload progress">
</div>

<!-- Log (additions only, removals not announced) -->
<div role="log" aria-live="polite" aria-relevant="additions">
</div>
```

### Fix: Tab Interface

```html
<div role="tablist" aria-label="Product information">
  <button role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1">
    Description
  </button>
  <button role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2" tabindex="-1">
    Reviews
  </button>
</div>

<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  Product description content...
</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
  Reviews content...
</div>
```

```javascript
// Arrow key navigation within tablist
tablist.addEventListener('keydown', (e) => {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(document.activeElement);
  let newIndex;

  switch (e.key) {
    case 'ArrowRight': newIndex = (index + 1) % tabs.length; break;
    case 'ArrowLeft': newIndex = (index - 1 + tabs.length) % tabs.length; break;
    case 'Home': newIndex = 0; break;
    case 'End': newIndex = tabs.length - 1; break;
    default: return;
  }

  tabs[newIndex].focus();
  activateTab(tabs[newIndex]);
  e.preventDefault();
});
```

### Debugging: What the Screen Reader Sees

```javascript
function logAccessibleName(element) {
  const computed = window.getComputedStyle(element);
  console.log({
    role: element.getAttribute('role') || element.tagName,
    name:
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent,
    state: {
      expanded: element.getAttribute('aria-expanded'),
      selected: element.getAttribute('aria-selected'),
      checked: element.getAttribute('aria-checked'),
      disabled: element.disabled,
    },
    visible: computed.display !== 'none' && computed.visibility !== 'hidden',
  });
}
```

---

## 6. Best Practices

### Do's

- **Start early** — Accessibility from the design phase, not as a retrofit
- **Use semantic HTML first** — Native elements need less ARIA and are more robust
- **Test with real screen readers** — Not just simulators; disabled users provide the best feedback
- **Automate what you can** — 30–50% of issues are detectable with axe/pa11y
- **Test in browse and focus modes** — Different screen reader experiences
- **Verify focus management** — Especially critical for SPAs with dynamic content
- **Test keyboard-only first** — Solid keyboard experience is the foundation for screen reader testing
- **Document accessible patterns** — Build a reusable accessible component library

### Don'ts

- **Don't rely only on automated testing** — Manual testing is required
- **Don't use ARIA as the first solution** — Native HTML always first
- **Don't hide focus outlines** — Keyboard users depend on them
- **Don't disable zoom** — Users need to resize text
- **Don't use color alone** — Multiple visual indicators required
- **Don't assume one screen reader is enough** — Test NVDA, VoiceOver, and JAWS
- **Don't ignore mobile** — Growing screen reader user base
- **Don't skip error states** — Most common screen reader issues occur in dynamic content
