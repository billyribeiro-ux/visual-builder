<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  type FieldType = 'text' | 'email' | 'tel' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';

  interface FormField {
    type?: FieldType;
    name?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    width?: 'full' | 'half';
    helpText?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    description?: string;
    fields?: FormField[];
    submitText?: string;
    successTitle?: string;
    successMessage?: string;
    layout?: 'stacked' | 'two-column';
    variant?: 'plain' | 'card';
    class?: string;
  }

  let {
    title = 'Book a personalized demo',
    description = '',
    fields = [],
    submitText = 'Submit',
    successTitle = 'Thanks, we received your request',
    successMessage = '',
    layout = 'stacked',
    variant = 'card',
    class: className = '',
    ...rest
  }: Props = $props();

  interface NormalizedField {
    index: number;
    type: FieldType;
    name: string;
    id: string;
    label: string;
    placeholder: string;
    required: boolean;
    options: string[];
    width: 'full' | 'half';
    helpText: string;
  }

  const FIELD_TYPES: ReadonlySet<string> = new Set(['text', 'email', 'tel', 'url', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date']);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const fallbackId = $props.id();
  /** Stable, readable ids derived from the node id (falls back to a hydration-safe component id). */
  const uid = $derived.by(() => {
    const nodeId = String(rest['data-node-id'] ?? '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return nodeId ? `form-${nodeId}` : fallbackId;
  });

  /** `Work email` → `work_email`: safe for `name` attributes and ids. */
  function slugify(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48);
  }

  /** Every field gets a slugified, unique `name` so the submitted payload has no collisions. */
  const formFields = $derived.by((): NormalizedField[] => {
    const used: string[] = [];
    return (Array.isArray(fields) ? fields : []).map((field, index) => {
      const type = (FIELD_TYPES.has(String(field?.type)) ? field.type : 'text') as FieldType;
      const label = String(field?.label ?? '').trim();
      let base = slugify(String(field?.name ?? '')) || slugify(label) || `field_${index + 1}`;
      if (/^[0-9]/.test(base)) base = `field_${base}`;
      let name = base;
      for (let n = 2; used.includes(name); n++) name = `${base}_${n}`;
      used.push(name);
      const options = (Array.isArray(field?.options) ? field.options : []).map((o) => String(o)).filter((o) => o.trim() !== '');
      return {
        index,
        type,
        name,
        id: `${uid}-${name}`,
        label: label || `Field ${index + 1}`,
        placeholder: String(field?.placeholder ?? ''),
        required: field?.required === true,
        options,
        width: field?.width === 'half' ? 'half' : 'full',
        helpText: String(field?.helpText ?? '')
      };
    });
  });

  let values = $state<Record<string, string | boolean>>({});
  let errors = $state<Record<string, string>>({});
  let attempted = $state(false);
  let submitted = $state(false);
  let summaryEl: HTMLElement | undefined = $state();
  let successEl: HTMLElement | undefined = $state();

  const errorList = $derived(formFields.filter((f) => errors[f.name]).map((f) => ({ field: f, message: errors[f.name] })));

  function textValue(name: string): string {
    const v = values[name];
    return typeof v === 'string' ? v : '';
  }

  function isUrl(value: string): boolean {
    try {
      const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
    } catch {
      return false;
    }
  }

  function isTel(value: string): boolean {
    const digits = value.replace(/\D/g, '');
    return /^\+?[0-9\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }

  function validate(field: NormalizedField): string {
    if (field.type === 'checkbox') {
      return field.required && values[field.name] !== true ? 'Check this box to continue.' : '';
    }
    const value = textValue(field.name).trim();
    if (!value) return field.required ? `${field.label} is required.` : '';
    switch (field.type) {
      case 'email':
        return EMAIL_RE.test(value) ? '' : 'Enter a valid email address, like name@company.com.';
      case 'url':
        return isUrl(value) ? '' : 'Enter a valid web address, like https://example.com.';
      case 'tel':
        return isTel(value) ? '' : 'Enter a valid phone number, including the area code.';
      case 'number':
        return Number.isFinite(Number(value)) ? '' : 'Enter a number.';
      case 'date':
        return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? '' : 'Enter a valid date.';
      case 'select':
      case 'radio':
        return field.options.includes(value) ? '' : 'Choose one of the options.';
      default:
        return '';
    }
  }

  function setError(field: NormalizedField, message: string) {
    if ((errors[field.name] ?? '') === message) return;
    const next = { ...errors };
    if (message) next[field.name] = message;
    else delete next[field.name];
    errors = next;
  }

  /** Re-checks a field once it has been touched (blur with a value) or after a submit attempt. */
  function revalidate(field: NormalizedField, onBlur = false) {
    const hasValue = field.type === 'checkbox' ? values[field.name] === true : textValue(field.name).trim() !== '';
    if (attempted || errors[field.name] || (onBlur && hasValue)) setError(field, validate(field));
  }

  function describedBy(field: NormalizedField): string | undefined {
    const ids = [field.helpText ? `${field.id}-help` : '', errors[field.name] ? `${field.id}-error` : ''].filter(Boolean);
    return ids.length ? ids.join(' ') : undefined;
  }

  /**
   * HTML autofill token for a field. `url` and `organization-title` are valid tokens per the
   * HTML spec but missing from TypeScript's DOM `AutoFill` union, hence the widened return type.
   */
  function autocompleteFor(field: NormalizedField): HTMLInputAttributes['autocomplete'] {
    const n = field.name;
    if (field.type === 'email' || /email/.test(n)) return 'email';
    if (field.type === 'tel' || /phone|mobile|tel/.test(n)) return 'tel';
    if (field.type === 'url') return 'url';
    if (/first/.test(n)) return 'given-name';
    if (/last|surname|family/.test(n)) return 'family-name';
    if (/^(full_)?name$/.test(n)) return 'name';
    if (/company|organi[sz]ation/.test(n)) return 'organization';
    if (/job|title|role/.test(n)) return 'organization-title';
    return 'off';
  }

  function focusField(field: NormalizedField) {
    document.getElementById(field.id)?.focus();
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    for (const field of formFields) {
      const message = validate(field);
      if (message) next[field.name] = message;
    }
    errors = next;
    attempted = true;
    if (Object.keys(next).length > 0) {
      await tick();
      summaryEl?.focus();
      return;
    }
    // Prototype only: nothing is sent anywhere. The success state is local.
    submitted = true;
    await tick();
    successEl?.focus();
  }

  function reset() {
    values = {};
    errors = {};
    attempted = false;
    submitted = false;
  }
</script>

<section {...rest} class={['form-builder', `layout-${layout}`, `variant-${variant}`, className]}>
  <div class="md-container shell">
    <div class="intro">
      <h2 class="title" id="{uid}-title" data-prop="title">{title}</h2>
      {#if description}
        <p class="description" data-prop="description">{description}</p>
      {/if}
    </div>

    <div class="surface">
      {#if submitted}
        <div class="success" role="status" tabindex="-1" bind:this={successEl}>
          <span class="success-icon"><Icon name="CheckCircle" size={28} /></span>
          <h3 class="success-title" data-prop="successTitle">{successTitle}</h3>
          {#if successMessage}
            <p class="success-message" data-prop="successMessage">{successMessage}</p>
          {/if}
          <p class="demo-note">
            <Icon name="Info" size={16} />
            <span>This form is not connected to a backend yet, so nothing was sent or stored.</span>
          </p>
          <button type="button" class="md-btn md-btn--md md-btn--outlined" onclick={reset}>Submit another response</button>
        </div>
      {:else}
        <form class="form" aria-labelledby="{uid}-title" novalidate onsubmit={handleSubmit}>
          {#if attempted && errorList.length > 0}
            <div class="summary" role="alert" tabindex="-1" aria-labelledby="{uid}-summary" bind:this={summaryEl}>
              <Icon name="WarningCircle" size={20} class="summary-icon" />
              <div>
                <p class="summary-title" id="{uid}-summary">
                  {errorList.length === 1 ? 'There is 1 problem with this form' : `There are ${errorList.length} problems with this form`}
                </p>
                <ul class="summary-list">
                  {#each errorList as entry (entry.field.name)}
                    <li>
                      <button type="button" class="summary-link" onclick={() => focusField(entry.field)}>{entry.message}</button>
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          {/if}

          <div class="fields">
            {#each formFields as field (field.name)}
              {@const error = errors[field.name]}
              <div class={['field', field.width === 'half' && 'field--half', error && 'field--invalid']}>
                {#if field.type === 'checkbox'}
                  <div class="check-row">
                    <input
                      id={field.id}
                      class="check"
                      type="checkbox"
                      name={field.name}
                      value="yes"
                      required={field.required}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={describedBy(field)}
                      checked={values[field.name] === true}
                      onchange={(event) => {
                        values[field.name] = event.currentTarget.checked;
                        revalidate(field, true);
                      }}
                    />
                    <label for={field.id} class="check-label">
                      <span data-prop={`fields.${field.index}.label`}>{field.label}</span>
                      {#if field.required}<span class="required" aria-hidden="true">*</span>{/if}
                    </label>
                  </div>
                {:else if field.type === 'radio'}
                  <fieldset
                    class="choice-group"
                    role="radiogroup"
                    aria-required={field.required ? 'true' : undefined}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={describedBy(field)}
                  >
                    <legend class="label">
                      <span data-prop={`fields.${field.index}.label`}>{field.label}</span>
                      {#if field.required}<span class="required" aria-hidden="true">*</span>{/if}
                    </legend>
                    <div class="choices">
                      {#each field.options as option, optionIndex (optionIndex)}
                        <label class="choice">
                          <input
                            id={optionIndex === 0 ? field.id : `${field.id}-${optionIndex}`}
                            type="radio"
                            class="check"
                            name={field.name}
                            value={option}
                            checked={textValue(field.name) === option}
                            onchange={() => {
                              values[field.name] = option;
                              revalidate(field, true);
                            }}
                          />
                          <span data-prop={`fields.${field.index}.options.${optionIndex}`}>{option}</span>
                        </label>
                      {/each}
                    </div>
                  </fieldset>
                {:else}
                  <label for={field.id} class="label">
                    <span data-prop={`fields.${field.index}.label`}>{field.label}</span>
                    {#if field.required}<span class="required" aria-hidden="true">*</span>{/if}
                  </label>
                  {#if field.type === 'textarea'}
                    <textarea
                      id={field.id}
                      class="control control--textarea"
                      name={field.name}
                      rows={4}
                      placeholder={field.placeholder}
                      required={field.required}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={describedBy(field)}
                      bind:value={() => textValue(field.name), (v) => (values[field.name] = v)}
                      oninput={() => revalidate(field)}
                      onblur={() => revalidate(field, true)}
                    ></textarea>
                  {:else if field.type === 'select'}
                    <div class="select-wrap">
                      <select
                        id={field.id}
                        class={['control', 'control--select', !textValue(field.name) && 'is-placeholder']}
                        name={field.name}
                        required={field.required}
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={describedBy(field)}
                        bind:value={() => textValue(field.name), (v) => (values[field.name] = v)}
                        onchange={() => revalidate(field, true)}
                      >
                        <option value="">{field.placeholder || 'Select an option'}</option>
                        {#each field.options as option, optionIndex (optionIndex)}
                          <option value={option}>{option}</option>
                        {/each}
                      </select>
                      <Icon name="CaretDown" size={16} class="select-caret" />
                    </div>
                  {:else}
                    <input
                      id={field.id}
                      class="control"
                      type={field.type}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      inputmode={field.type === 'number' ? 'decimal' : undefined}
                      autocomplete={autocompleteFor(field)}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={describedBy(field)}
                      bind:value={() => textValue(field.name), (v) => (values[field.name] = v == null ? '' : String(v))}
                      oninput={() => revalidate(field)}
                      onblur={() => revalidate(field, true)}
                    />
                  {/if}
                {/if}

                {#if field.helpText}
                  <p class="help" id="{field.id}-help" data-prop={`fields.${field.index}.helpText`}>{field.helpText}</p>
                {/if}
                {#if error}
                  <p class="error" id="{field.id}-error">
                    <Icon name="WarningCircle" size={14} />
                    <span>{error}</span>
                  </p>
                {/if}
              </div>
            {/each}
          </div>

          <div class="actions">
            <button type="submit" class="md-btn md-btn--lg md-btn--filled submit">
              <span data-prop="submitText">{submitText}</span>
              <Icon name="ArrowRight" size={18} />
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</section>

<style>
  .form-builder {
    width: 100%;
    padding: 5rem 0;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .shell {
    display: grid;
    gap: 2.5rem;
  }
  .layout-stacked .shell {
    max-width: 46rem;
  }
  .layout-stacked .intro {
    text-align: center;
    max-width: 36rem;
    margin: 0 auto;
  }
  .layout-two-column .shell {
    max-width: 1200px;
  }
  @media (min-width: 1024px) {
    .layout-two-column .shell {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      gap: 4rem;
      align-items: start;
    }
    .layout-two-column .intro {
      position: sticky;
      top: 6rem;
      padding-top: 1rem;
    }
  }

  .title {
    font-size: 2.25rem;
    line-height: 1.15;
    font-weight: 700;
    letter-spacing: -0.03em;
    text-wrap: balance;
  }
  .description {
    margin-top: 1rem;
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }

  .variant-card .surface {
    padding: 2rem;
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 12px 32px -12px rgba(0, 0, 0, 0.1);
  }

  /* ---------------------------------------------------------------- fields */
  .form {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem 1rem;
  }
  .field {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }
  .field--half {
    grid-column: span 1;
  }
  @container (max-width: 30rem) {
    .field--half {
      grid-column: 1 / -1;
    }
  }

  .label {
    display: inline-flex;
    gap: 0.25rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .required {
    color: var(--md-sys-color-error);
  }

  .control {
    width: 100%;
    min-height: 44px;
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    line-height: 1.5rem;
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 45%, var(--md-sys-color-outline-variant));
    border-radius: var(--md-sys-shape-corner-small, 8px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    outline: none;
    transition:
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .control::placeholder {
    color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 75%, transparent);
  }
  .control:hover {
    border-color: var(--md-sys-color-outline);
  }
  .control:focus {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
  }
  .field--invalid .control {
    border-color: var(--md-sys-color-error);
  }
  .field--invalid .control:focus {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-error) 18%, transparent);
  }
  .control--textarea {
    min-height: 7.5rem;
    resize: vertical;
  }
  .select-wrap {
    position: relative;
  }
  .control--select {
    appearance: none;
    padding-right: 2.5rem;
    cursor: pointer;
  }
  .control--select.is-placeholder {
    color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 75%, transparent);
  }
  .select-wrap :global(.select-caret) {
    position: absolute;
    right: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--md-sys-color-on-surface-variant);
  }

  .check {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 0.125rem;
    accent-color: var(--md-sys-color-primary);
    cursor: pointer;
  }
  .check-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .check-label {
    font-size: 0.875rem;
    line-height: 1.375rem;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
  }
  .choice-group {
    border: none;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }
  .choice-group .label {
    margin-bottom: 0.625rem;
  }
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .choice {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 40px;
    padding: 0.5rem 0.875rem;
    font-size: 0.875rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 35%, var(--md-sys-color-outline-variant));
    background-color: var(--md-sys-color-surface-container-lowest);
    cursor: pointer;
    transition:
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .choice .check {
    margin-top: 0;
  }
  .choice:has(:checked) {
    border-color: var(--md-sys-color-primary);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 6%, transparent);
  }

  .help {
    font-size: 0.8125rem;
    line-height: 1.25rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .error {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    font-size: 0.8125rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: var(--md-sys-color-error);
  }
  .error :global(.icon) {
    margin-top: 0.1875rem;
  }

  /* ---------------------------------------------------------------- summary */
  .summary {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.125rem;
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: color-mix(in srgb, var(--md-sys-color-error-container) 55%, var(--md-sys-color-surface-container-lowest));
    border: 1px solid color-mix(in srgb, var(--md-sys-color-error) 35%, transparent);
    color: var(--md-sys-color-on-error-container);
  }
  .summary:focus-visible {
    outline: 2px solid var(--md-sys-color-error);
    outline-offset: 2px;
  }
  .summary :global(.summary-icon) {
    flex-shrink: 0;
    margin-top: 0.0625rem;
    color: var(--md-sys-color-error);
  }
  .summary-title {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.375rem;
  }
  .summary-list {
    list-style: none;
    margin-top: 0.375rem;
    display: grid;
    gap: 0.25rem;
  }
  .summary-link {
    padding: 0.125rem 0;
    font-size: 0.875rem;
    text-align: left;
    color: var(--md-sys-color-error);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* ---------------------------------------------------------------- actions + success */
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
  .submit {
    font-weight: 600;
  }
  @container (max-width: 30rem) {
    .submit {
      width: 100%;
    }
  }

  .success {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
    padding: 2rem 0.5rem;
    outline: none;
  }
  .success-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 0.25rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
  }
  .success-title {
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .success-message {
    max-width: 28rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  .demo-note {
    display: inline-flex;
    align-items: flex-start;
    gap: 0.5rem;
    max-width: 28rem;
    margin: 0.5rem 0 0.75rem;
    padding: 0.625rem 0.875rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container);
    font-size: 0.8125rem;
    line-height: 1.25rem;
    text-align: left;
    color: var(--md-sys-color-on-surface-variant);
  }
  .demo-note :global(.icon) {
    margin-top: 0.125rem;
  }

  @media (max-width: 767px) {
    .form-builder {
      padding: 3.5rem 0;
    }
    .title {
      font-size: 1.875rem;
    }
    .variant-card .surface {
      padding: 1.25rem;
    }
  }
</style>
