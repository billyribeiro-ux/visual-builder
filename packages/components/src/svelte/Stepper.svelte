<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  type FieldType = 'text' | 'email' | 'url' | 'tel' | 'number' | 'textarea';

  interface StepField {
    label: string;
    placeholder?: string;
    type?: FieldType;
    required?: boolean;
  }

  interface Step {
    title: string;
    description?: string;
    fields: StepField[];
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    description?: string;
    steps?: Step[];
    submitText?: string;
    successTitle?: string;
    successMessage?: string;
    class?: string;
  }

  let {
    title = '',
    description = '',
    steps = [],
    submitText = 'Submit',
    successTitle = 'All set',
    successMessage = '',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const FIELD_TYPES: readonly FieldType[] = ['text', 'email', 'url', 'tel', 'number', 'textarea'];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const safeSteps = $derived(
    (Array.isArray(steps) ? steps : []).map((step) => ({
      title: step?.title ?? '',
      description: step?.description ?? '',
      fields: (Array.isArray(step?.fields) ? step.fields : []).map((field) => ({
        label: field?.label ?? '',
        placeholder: field?.placeholder ?? '',
        type: FIELD_TYPES.includes(field?.type as FieldType) ? (field.type as FieldType) : ('text' as FieldType),
        required: field?.required !== false
      }))
    }))
  );
  const reviewIndex = $derived(safeSteps.length);

  let current = $state(0);
  let submitted = $state(false);
  let values = $state<Record<string, string>>({});
  let errors = $state<Record<string, string>>({});
  /** Form ref used only to focus the first invalid field (not reactive). */
  let formEl: HTMLFormElement | undefined;

  function trackForm(node: HTMLFormElement) {
    formEl = node;
    return () => (formEl = undefined);
  }

  const activeIndex = $derived(Math.min(current, reviewIndex));
  const activeStep = $derived(activeIndex < reviewIndex ? safeSteps[activeIndex] : null);

  function key(stepIndex: number, fieldIndex: number): string {
    return `${stepIndex}.${fieldIndex}`;
  }

  function validateField(field: { label: string; type: FieldType; required: boolean }, raw: string | undefined): string {
    const value = (raw ?? '').trim();
    const name = field.label || 'This field';
    if (!value) return field.required ? `${name} is required.` : '';
    if (field.type === 'email' && !EMAIL_RE.test(value)) return 'Enter a valid email address, e.g. name@company.com.';
    if (field.type === 'url' && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(value)) return 'Enter a full URL starting with https://.';
    if (field.type === 'number' && !Number.isFinite(Number(value))) return `${name} must be a number.`;
    return '';
  }

  async function focusFirstError() {
    await tick();
    formEl?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }

  async function focusHeading() {
    await tick();
    document.getElementById(`${uid}-step-heading`)?.focus();
  }

  function next() {
    if (!activeStep) return;
    const nextErrors: Record<string, string> = { ...errors };
    let valid = true;
    activeStep.fields.forEach((field, fi) => {
      const message = validateField(field, values[key(activeIndex, fi)]);
      if (message) valid = false;
      nextErrors[key(activeIndex, fi)] = message;
    });
    errors = nextErrors;
    if (!valid) {
      focusFirstError();
      return;
    }
    current = activeIndex + 1;
    focusHeading();
  }

  function back() {
    if (activeIndex === 0) return;
    current = activeIndex - 1;
    focusHeading();
  }

  function editStep(index: number) {
    current = index;
    focusHeading();
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (activeIndex < reviewIndex) {
      next();
      return;
    }
    // Re-validate everything before the (mock) submission.
    const firstInvalid = safeSteps.findIndex((step, si) => step.fields.some((field, fi) => validateField(field, values[key(si, fi)])));
    if (firstInvalid !== -1) {
      current = firstInvalid;
      next();
      return;
    }
    submitted = true;
    focusHeading();
  }

  function reset() {
    values = {};
    errors = {};
    current = 0;
    submitted = false;
    focusHeading();
  }

  function handleInput(k: string, value: string) {
    values[k] = value;
    if (errors[k]) errors[k] = '';
  }
</script>

<section {...rest} class={['stepper', className]}>
  {#if title || description}
    <header class="header">
      {#if title}<h3 class="title" data-prop="title">{title}</h3>{/if}
      {#if description}<p class="description" data-prop="description">{description}</p>{/if}
    </header>
  {/if}

  <ol class="indicator" aria-label="Progress">
    {#each [...safeSteps.map((s) => s.title), 'Review & submit'] as stepTitle, i (i)}
      {@const status = submitted || i < activeIndex ? 'complete' : i === activeIndex ? 'current' : 'upcoming'}
      <li class={['indicator-step', `is-${status}`]} aria-current={status === 'current' ? 'step' : undefined}>
        <span class="marker" aria-hidden="true">
          {#if status === 'complete'}
            <Icon name="Check" size={14} />
          {:else}
            {i + 1}
          {/if}
        </span>
        <span class="indicator-text">
          <span class="indicator-title">
            {#if i < reviewIndex}
              <span data-prop={`steps.${i}.title`}>{stepTitle}</span>
            {:else}
              {stepTitle}
            {/if}
          </span>
          <span class="sr-only">, {status === 'complete' ? 'completed' : status === 'current' ? 'current step' : 'not started'}</span>
        </span>
      </li>
    {/each}
  </ol>

  <div class="panel">
    {#if submitted}
      <div class="success" role="status">
        <span class="success-icon" aria-hidden="true"><Icon name="CheckCircle" size={28} /></span>
        <h4 class="step-heading" id="{uid}-step-heading" tabindex="-1" data-prop="successTitle">{successTitle}</h4>
        {#if successMessage}
          <p class="step-description" data-prop="successMessage">{successMessage}</p>
        {/if}
        <button type="button" class="md-btn md-btn--outlined btn-secondary" onclick={reset}>Start over</button>
      </div>
    {:else}
      <form {@attach trackForm} onsubmit={handleSubmit} novalidate>
        {#if activeStep}
          <h4 class="step-heading" id="{uid}-step-heading" tabindex="-1" data-prop={`steps.${activeIndex}.title`}>{activeStep.title}</h4>
          {#if activeStep.description}
            <p class="step-description" data-prop={`steps.${activeIndex}.description`}>{activeStep.description}</p>
          {/if}
          <div class="fields">
            {#each activeStep.fields as field, fi (`${activeIndex}-${fi}`)}
              {@const k = key(activeIndex, fi)}
              {@const id = `${uid}-f-${activeIndex}-${fi}`}
              <div class="field">
                <label class="md-field-label label" for={id}>
                  <span data-prop={`steps.${activeIndex}.fields.${fi}.label`}>{field.label}</span>
                  {#if !field.required}<span class="optional">Optional</span>{/if}
                </label>
                {#if field.type === 'textarea'}
                  <textarea
                    {id}
                    class={['md-input', 'input', errors[k] && 'is-invalid']}
                    rows="3"
                    placeholder={field.placeholder}
                    required={field.required}
                    aria-invalid={errors[k] ? 'true' : undefined}
                    aria-describedby={errors[k] ? `${id}-error` : undefined}
                    value={values[k] ?? ''}
                    oninput={(event) => handleInput(k, event.currentTarget.value)}
                  ></textarea>
                {:else}
                  <input
                    {id}
                    class={['md-input', 'input', errors[k] && 'is-invalid']}
                    type={field.type}
                    inputmode={field.type === 'number' ? 'decimal' : undefined}
                    placeholder={field.placeholder}
                    required={field.required}
                    autocomplete={field.type === 'email' ? 'email' : 'off'}
                    aria-invalid={errors[k] ? 'true' : undefined}
                    aria-describedby={errors[k] ? `${id}-error` : undefined}
                    value={values[k] ?? ''}
                    oninput={(event) => handleInput(k, event.currentTarget.value)}
                  />
                {/if}
                {#if errors[k]}
                  <p class="error" id="{id}-error">
                    <Icon name="WarningCircle" size={14} />
                    {errors[k]}
                  </p>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <h4 class="step-heading" id="{uid}-step-heading" tabindex="-1">Review &amp; submit</h4>
          <p class="step-description">Check your details before submitting.</p>
          <div class="review">
            {#each safeSteps as step, si (si)}
              <div class="review-group">
                <div class="review-head">
                  <span class="review-title">{step.title}</span>
                  <button type="button" class="edit-btn" onclick={() => editStep(si)} aria-label="Edit {step.title}">Edit</button>
                </div>
                <dl class="review-list">
                  {#each step.fields as field, fi (fi)}
                    <div class="review-row">
                      <dt>{field.label}</dt>
                      <dd class={[!values[key(si, fi)]?.trim() && 'is-empty']}>{values[key(si, fi)]?.trim() || 'Not provided'}</dd>
                    </div>
                  {/each}
                </dl>
              </div>
            {/each}
          </div>
        {/if}

        <div class="actions">
          {#if activeIndex > 0}
            <button type="button" class="md-btn md-btn--outlined btn-secondary" onclick={back}>
              <Icon name="ArrowLeft" size={16} />
              Back
            </button>
          {/if}
          <button type="submit" class="md-btn md-btn--filled btn-primary">
            {#if activeIndex === reviewIndex}
              <span data-prop="submitText">{submitText}</span>
            {:else}
              Continue
              <Icon name="ArrowRight" size={16} />
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</section>

<style>
  .stepper {
    --stepper-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    min-width: 0;
    max-width: 48rem;
    border: 1px solid var(--stepper-border);
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04);
  }
  .header {
    padding: 1.5rem 1.75rem 0;
  }
  .title {
    font-size: 1.125rem;
    font-weight: 650;
    letter-spacing: -0.01em;
  }
  .description {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .indicator {
    display: flex;
    gap: 0.5rem;
    padding: 1.25rem 1.75rem;
    border-bottom: 1px solid var(--stepper-border);
    list-style: none;
  }
  .indicator-step {
    flex: 1 1 0;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
  }
  .indicator-step:not(:last-child)::after {
    content: '';
    flex: 1 1 1rem;
    min-width: 1rem;
    height: 1px;
    background-color: var(--stepper-border);
  }
  .indicator-step.is-complete:not(:last-child)::after {
    background-color: var(--md-sys-color-primary);
  }
  .marker {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    border: 1.5px solid var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.75rem;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
  .is-current .marker {
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
  }
  .is-complete .marker {
    border-color: var(--md-sys-color-primary);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .indicator-text {
    min-width: 0;
  }
  .indicator-title {
    display: block;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .is-current .indicator-title,
  .is-complete .indicator-title {
    color: var(--md-sys-color-on-surface);
    font-weight: 600;
  }
  .panel {
    padding: 1.5rem 1.75rem 1.75rem;
  }
  .step-heading {
    font-size: 1rem;
    font-weight: 650;
    outline: none;
  }
  .step-description {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .fields {
    display: grid;
    gap: 1.125rem;
    margin-top: 1.25rem;
  }
  .label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }
  .optional {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--md-sys-color-on-surface-variant);
  }
  .input {
    min-height: 2.5rem;
    padding: 0.5625rem 0.75rem;
    border-color: var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  textarea.input {
    resize: vertical;
  }
  .input.is-invalid {
    border-color: var(--md-sys-color-error);
  }
  .input.is-invalid:focus {
    box-shadow: 0 0 0 1px var(--md-sys-color-error);
  }
  .error {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.375rem;
    font-size: 0.8125rem;
    color: var(--md-sys-color-error);
  }
  .review {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }
  .review-group {
    border: 1px solid var(--stepper-border);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    overflow: hidden;
  }
  .review-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    background-color: var(--md-sys-color-surface-container-low);
  }
  .review-title {
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .edit-btn {
    min-height: 2.25rem;
    padding: 0 0.75rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-primary);
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .edit-btn:hover {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
  }
  .review-list {
    display: grid;
  }
  .review-row {
    display: grid;
    grid-template-columns: minmax(8rem, 1fr) 2fr;
    gap: 1rem;
    padding: 0.625rem 1rem;
    border-top: 1px solid var(--stepper-border);
    font-size: 0.875rem;
  }
  .review-row dt {
    color: var(--md-sys-color-on-surface-variant);
  }
  .review-row dd {
    overflow-wrap: anywhere;
  }
  .review-row dd.is-empty {
    color: var(--md-sys-color-on-surface-variant);
    font-style: italic;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.75rem;
  }
  .btn-secondary {
    color: var(--md-sys-color-on-surface);
    border-color: var(--md-sys-color-outline-variant);
  }
  .success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1.5rem 0 0.5rem;
    text-align: center;
  }
  .success-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.25rem;
    height: 3.25rem;
    margin-bottom: 0.75rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
  }
  .success .step-description {
    max-width: 26rem;
  }
  .success .btn-secondary {
    margin-top: 1.25rem;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 767px) {
    .header {
      padding: 1.25rem 1.25rem 0;
    }
    .indicator {
      padding: 1rem 1.25rem;
    }
    .indicator-step:not(.is-current) .indicator-text {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
    .indicator-step {
      flex: 0 1 auto;
    }
    .indicator-step.is-current {
      flex: 1 1 auto;
    }
    .indicator-step:not(:last-child)::after {
      flex: 0 0 1rem;
    }
    .indicator-step.is-current:not(:last-child)::after {
      flex: 1 1 1rem;
    }
    .panel {
      padding: 1.25rem;
    }
    .review-row {
      grid-template-columns: 1fr;
      gap: 0.125rem;
    }
    .actions {
      flex-direction: column-reverse;
    }
    .actions .md-btn {
      width: 100%;
    }
  }
</style>
