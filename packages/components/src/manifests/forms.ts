import { z } from 'zod';
import type { ComponentManifest } from '@app-viz/schema';

/** Forms: form builder, search bar, login form. */

export const FORM_FIELD_TYPES = ['text', 'email', 'tel', 'url', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date'] as const;
export const SEARCH_PARAM_NAMES = ['q', 'query', 'search', 's', 'term', 'keyword'] as const;
export const SOCIAL_PROVIDERS = ['google', 'github', 'apple', 'microsoft'] as const;

const formFieldSchema = z.object({
  type: z.enum(FORM_FIELD_TYPES).default('text'),
  name: z.string().default(''),
  label: z.string().default(''),
  placeholder: z.string().default(''),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  width: z.enum(['full', 'half']).default('full'),
  helpText: z.string().default('')
});

const HONEST_FORM =
  'The submit handler is a local mock: nothing is sent or stored. After a valid submit the success state shows a fixed note saying the form is not connected to a backend. Wire it to a real endpoint (e.g. a SvelteKit form action or remote function) with server-side validation that mirrors the client rules, then remove the note.';

export const FORMS_MANIFESTS: Record<string, ComponentManifest<any>> = {
  'forms/form': {
    type: 'forms/form',
    displayName: 'Form Builder',
    category: 'forms',
    description: 'A configurable form with typed fields, inline validation, an error summary and a success state.',
    icon: 'Textbox',
    component: 'FormBuilder',
    isSection: true,
    keywords: ['form', 'fields', 'input', 'contact', 'lead', 'demo request', 'survey', 'validation', 'select', 'checkbox', 'radio'],
    propsSchema: z.object({
      title: z.string().default('Book a personalized demo'),
      description: z.string().default(''),
      fields: z.array(formFieldSchema).default([]),
      submitText: z.string().default('Submit'),
      successTitle: z.string().default('Thanks, we received your request'),
      successMessage: z.string().default(''),
      layout: z.enum(['stacked', 'two-column']).default('stacked'),
      variant: z.enum(['plain', 'card']).default('card')
    }),
    defaultProps: {
      title: 'Book a personalized demo',
      description:
        'Tell us about your team and data stack, and we will tailor a 30-minute walkthrough to the metrics you care about. Most requests get a reply within one business day.',
      fields: [
        { type: 'text', name: 'first_name', label: 'First name', placeholder: 'Jordan', required: true, options: [], width: 'half', helpText: '' },
        { type: 'text', name: 'last_name', label: 'Last name', placeholder: 'Rivera', required: true, options: [], width: 'half', helpText: '' },
        { type: 'email', name: 'email', label: 'Work email', placeholder: 'jordan@company.com', required: true, options: [], width: 'half', helpText: '' },
        { type: 'text', name: 'company', label: 'Company', placeholder: 'Company name', required: false, options: [], width: 'half', helpText: '' },
        {
          type: 'select',
          name: 'team_size',
          label: 'Team size',
          placeholder: 'Select team size',
          required: true,
          options: ['1–10', '11–50', '51–200', '201–1,000', 'More than 1,000'],
          width: 'half',
          helpText: ''
        },
        {
          type: 'tel',
          name: 'phone',
          label: 'Phone',
          placeholder: '+1 (555) 000-0000',
          required: false,
          options: [],
          width: 'half',
          helpText: 'Only used to schedule your demo.'
        },
        {
          type: 'textarea',
          name: 'message',
          label: 'What would you like to see?',
          placeholder: 'Tell us about your data sources, your team and the questions you want answered.',
          required: false,
          options: [],
          width: 'full',
          helpText: ''
        },
        {
          type: 'checkbox',
          name: 'updates',
          label: 'Send me occasional product updates. Unsubscribe anytime.',
          placeholder: '',
          required: false,
          options: [],
          width: 'full',
          helpText: ''
        }
      ],
      submitText: 'Request demo',
      successTitle: 'Thanks, your request is in',
      successMessage: 'A product specialist will reply within one business day to find a time that works for you.',
      layout: 'two-column',
      variant: 'card'
    },
    propControls: {
      title: { label: 'Title', group: 'Content' },
      description: { label: 'Description', type: 'textarea', group: 'Content' },
      fields: {
        label: 'Fields',
        group: 'Fields',
        help: 'Each field: type (text, email, tel, url, number, textarea, select, checkbox, radio, date), label, optional name (derived from the label when empty), placeholder, required, width (full or half), help text and options (select and radio only).'
      },
      submitText: { label: 'Submit button', group: 'Buttons' },
      successTitle: { label: 'Success title', group: 'Success state' },
      successMessage: { label: 'Success message', type: 'textarea', group: 'Success state' },
      layout: {
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'stacked', label: 'Stacked (heading above form)' },
          { value: 'two-column', label: 'Two columns (heading beside form)' }
        ],
        group: 'Settings'
      },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'card', label: 'Card' },
          { value: 'plain', label: 'Plain' }
        ],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      '`layout: "stacked"` centers the heading above a 46rem-wide form; `layout: "two-column"` puts the heading in a left column (5fr, sticky) beside the form (7fr) from 1024px and stacks below 1024px. `variant: "card"` wraps the form in a bordered, softly shadowed card; `"plain"` renders it without chrome.',
      'Fields render in a 2-column grid: `width: "half"` fields take one column, `"full"` fields span both; every field spans the full row when the form itself is narrower than 30rem (CSS container query).',
      'Field types: text/email/tel/url/number/date render <input type>, textarea renders a 4-row <textarea>, select renders a native <select> whose first option (value "") shows the placeholder, radio renders a fieldset + legend with one radio per option, checkbox renders a single checkbox whose label is the field label. Labels are always visible; required fields show a decorative red asterisk (aria-hidden) and carry the `required` attribute.',
      'Field `name` attributes are slugified from `name` (or the label when empty) to snake_case ([a-z0-9_]) and de-duplicated with _2, _3… suffixes so the payload never has collisions; element ids are derived from the node id (fallback: a hydration-safe component id) so several forms per page stay valid.',
      'Validation runs on submit (the form has novalidate): required fields, email format, http(s) URLs (scheme optional), phone numbers (7–15 digits, + ( ) - . and spaces allowed), finite numbers, ISO dates and select/radio values that must be one of the options. Invalid fields get aria-invalid="true", a red border and an inline error message linked through aria-describedby (together with the help text). After the first submit attempt, fields re-validate as the user types; a field with a value is also validated on blur.',
      'On an invalid submit an error summary (role="alert", tabindex -1) appears above the fields and receives focus; it lists every problem as a button that moves focus to the offending field.',
      `On a valid submit the form is replaced by a focusable success panel (role="status") with the success title, message, a "Submit another response" button that resets the form, and the honest note. ${HONEST_FORM}`
    ]
  },

  'forms/search-bar': {
    type: 'forms/search-bar',
    displayName: 'Search Bar',
    category: 'forms',
    description: 'A labelled site search field with a submit button and optional suggestion chips.',
    icon: 'MagnifyingGlass',
    component: 'SearchBar',
    keywords: ['search', 'find', 'query', 'lookup', 'docs search', 'input', 'suggestions'],
    propsSchema: z.object({
      placeholder: z.string().default('Search'),
      buttonText: z.string().default('Search'),
      variant: z.enum(['inline', 'pill', 'minimal']).default('pill'),
      actionHref: z.string().default('/search'),
      paramName: z.enum(SEARCH_PARAM_NAMES).default('q'),
      suggestionsLabel: z.string().default(''),
      suggestions: z.array(z.string()).default([])
    }),
    defaultProps: {
      placeholder: 'Search docs, guides and API reference',
      buttonText: 'Search',
      variant: 'pill',
      actionHref: '/search',
      paramName: 'q',
      suggestionsLabel: 'Popular:',
      suggestions: ['Connect a data source', 'Anomaly alerts', 'API keys', 'SSO setup']
    },
    propControls: {
      placeholder: { label: 'Placeholder', group: 'Content' },
      buttonText: { label: 'Button text', help: 'Leave empty to show an icon-only submit button.', group: 'Buttons' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'pill', label: 'Pill (button inside)' },
          { value: 'inline', label: 'Inline (separate button)' },
          { value: 'minimal', label: 'Minimal (underline)' }
        ],
        group: 'Settings'
      },
      actionHref: { label: 'Results page', type: 'url', help: 'The page that receives the query, e.g. /search.', group: 'Settings' },
      paramName: {
        label: 'Query parameter',
        type: 'select',
        options: SEARCH_PARAM_NAMES.map((name) => ({ value: name, label: `?${name}=` })),
        help: 'Name of the query-string parameter your results page reads.',
        group: 'Settings'
      },
      suggestionsLabel: { label: 'Suggestions label', group: 'Suggestions' },
      suggestions: { label: 'Suggestions', help: 'Quick searches shown as chips below the field.', group: 'Suggestions' }
    },
    slots: [],
    behaviour: [
      'Renders a <form role="search" method="get"> (accessible name = the button text, else "Search") with a visually hidden <label> bound to an <input type="search" name={paramName}>, a leading magnifying-glass icon and a submit button. Without JavaScript the form submits natively to `actionHref`.',
      'Variants: "pill" is one fully rounded surface with the filled button inside; "inline" is a bordered field with a separate filled button (stacked full-width below 768px); "minimal" is an underlined field with a text button. Focus shows a primary ring/underline. Max width 42rem, centered.',
      'On submit the term is trimmed; an empty term only focuses the input. Otherwise the component builds `<actionHref>?<paramName>=<encoded term>` (appending with & when the URL already has a query, keeping any #hash) and calls requestNavigation(), which the canvas intercepts and the exported app follows.',
      '`paramName` is limited to common names (q, query, search, s, term, keyword) so the URL is always valid. Suggestion chips are buttons: clicking one fills the field and searches for it immediately. Wire `actionHref` to a real results page that reads the parameter.'
    ]
  },

  'forms/login-form': {
    type: 'forms/login-form',
    displayName: 'Login Form',
    category: 'forms',
    description: 'A compact sign-in card with social providers, email and password, remember me and a reset link.',
    icon: 'SignIn',
    component: 'LoginForm',
    isSection: true,
    keywords: ['login', 'sign in', 'auth', 'authentication', 'password', 'oauth', 'social login', 'account'],
    propsSchema: z.object({
      title: z.string().default('Welcome back'),
      subtitle: z.string().default(''),
      socialProviders: z
        .array(z.object({ provider: z.enum(SOCIAL_PROVIDERS).default('google'), label: z.string().default('') }))
        .default([]),
      dividerText: z.string().default('or'),
      emailLabel: z.string().default('Email'),
      passwordLabel: z.string().default('Password'),
      rememberText: z.string().default('Remember me'),
      forgotText: z.string().default('Forgot password?'),
      forgotHref: z.string().default('/forgot-password'),
      submitText: z.string().default('Sign in'),
      footerText: z.string().default(''),
      signupText: z.string().default(''),
      signupHref: z.string().default('/signup'),
      redirectHref: z.string().default('/dashboard')
    }),
    defaultProps: {
      title: 'Sign in to Halden',
      subtitle: 'Welcome back. Pick up right where you left off.',
      socialProviders: [
        { provider: 'google', label: 'Continue with Google' },
        { provider: 'microsoft', label: 'Continue with Microsoft' }
      ],
      dividerText: 'or',
      emailLabel: 'Work email',
      passwordLabel: 'Password',
      rememberText: 'Keep me signed in for 30 days',
      forgotText: 'Forgot password?',
      forgotHref: '/forgot-password',
      submitText: 'Sign in',
      footerText: 'New to Halden?',
      signupText: 'Create an account',
      signupHref: '/signup',
      redirectHref: '/dashboard'
    },
    propControls: {
      title: { label: 'Title', group: 'Content' },
      subtitle: { label: 'Subtitle', type: 'textarea', group: 'Content' },
      socialProviders: {
        label: 'Social sign-in',
        help: 'Provider (google, github, apple, microsoft) and button label. Remove all to hide the social buttons and divider.',
        group: 'Social sign-in'
      },
      dividerText: { label: 'Divider text', group: 'Social sign-in' },
      emailLabel: { label: 'Email label', group: 'Fields' },
      passwordLabel: { label: 'Password label', group: 'Fields' },
      rememberText: { label: 'Remember me text', help: 'Leave empty to hide the checkbox.', group: 'Fields' },
      forgotText: { label: 'Forgot password text', help: 'Leave empty to hide the link.', group: 'Buttons' },
      forgotHref: { label: 'Forgot password link', type: 'url', group: 'Buttons' },
      submitText: { label: 'Submit button', group: 'Buttons' },
      footerText: { label: 'Footer text', group: 'Footer' },
      signupText: { label: 'Sign-up link text', group: 'Footer' },
      signupHref: { label: 'Sign-up link', type: 'url', group: 'Footer' },
      redirectHref: { label: 'Redirect after sign-in', type: 'url', help: 'Page opened after a valid (mock) sign-in.', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'A centered 25rem card: title and optional subtitle, social sign-in buttons (one full-width outlined button per provider with its monochrome logo: Google, GitHub, Apple, Microsoft/Windows), an "or" divider (only when providers exist), email and password fields, an optional "remember me" checkbox, a full-width filled submit button and an optional footer with a sign-up link.',
      'The password field has a show/hide toggle button (aria-pressed, aria-controls, label "Show password"/"Hide password"). The "forgot password" link sits on the password label row.',
      'Validation on submit (novalidate): email required + format, password required. Errors appear inline (aria-invalid, aria-describedby) and focus moves to the first invalid field; after the first attempt fields re-validate while typing.',
      'Honest prototype: credentials are never checked. A valid submit shows "Demo sign-in only: no account was checked. Redirecting…" in a role="status" live region and calls requestNavigation(redirectHref) after 900ms. Social buttons only announce that the provider is not connected. Replace both with real authentication (session cookie set by a server action/OAuth flow) when implementing.'
    ]
  }
};
