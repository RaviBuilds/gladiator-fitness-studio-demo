"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { SubmitButton } from "@/components/ui/Button";
import { contact } from "@/lib/contact";
import {
  CONTACT_ELAPSED_FIELD,
  CONTACT_HONEYPOT_FIELD,
  CONTACT_LIMITS,
  validateContactSubmission,
} from "@/lib/contact-validation";
import type { ContactFieldName } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";
type FieldMessages = Partial<Record<ContactFieldName, string>>;

/**
 * Section 10 — inquiry form.
 *
 * Client component because validation, submission state and focus management
 * need interaction. Every string comes from lib/contact.ts, so a gym clone
 * never edits this file. Posts JSON to the server-only /api/contact route;
 * no key, recipient or provider detail exists in this bundle.
 *
 * States: idle → submitting → success | error. Entered content survives an
 * error so nothing is retyped; it is cleared only after a confirmed send.
 */
export function ContactForm() {
  const copy = contact.form;
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldMessages>({});
  const [messageLength, setMessageLength] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  /**
   * When the visitor first saw the form. Set in an effect (never during
   * render) and sent with the submission so the server can reject posts
   * returned faster than a human could type one.
   */
  const startedAtRef = useRef<number | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const clearFieldError = (field: ContactFieldName) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const focusField = (field: ContactFieldName) => {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return; // no duplicate submissions

    const form = event.currentTarget;
    const data = new FormData(form);
    const submission = {
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    // Same rules the server re-applies; the server stays the authority.
    const validation = validateContactSubmission(submission, {
      collectEmail: contact.collectEmail,
    });

    if (!validation.ok) {
      const messages: FieldMessages = {};
      for (const [field, code] of Object.entries(validation.fieldErrors) as [
        ContactFieldName,
        "required" | "tooShort" | "tooLong" | "invalid",
      ][]) {
        messages[field] = contact.form.fields[field].errors[code] ?? copy.validationSummary;
      }
      setFieldErrors(messages);
      setFormError(copy.validationSummary);
      setStatus("error");
      const first = (Object.keys(messages) as ContactFieldName[])[0];
      if (first) focusField(first);
      return;
    }

    setStatus("submitting");
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validation.values,
          [CONTACT_HONEYPOT_FIELD]: String(data.get(CONTACT_HONEYPOT_FIELD) ?? ""),
          // Omitted when unknown; the server then treats timing as human.
          ...(startedAtRef.current !== null
            ? { [CONTACT_ELAPSED_FIELD]: Date.now() - startedAtRef.current }
            : {}),
        }),
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
        setMessageLength(0);
        requestAnimationFrame(() => successRef.current?.focus());
        return;
      }

      // Only configured, server-approved copy is ever shown to the visitor.
      const result = (await response.json().catch(() => null)) as
        | { error?: string; fieldErrors?: FieldMessages }
        | null;

      if (response.status === 400 && result?.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        const first = (Object.keys(result.fieldErrors) as ContactFieldName[])[0];
        if (first) focusField(first);
      }

      setFormError(result?.error ?? copy.errorMessage);
      setStatus("error");
    } catch {
      setFormError(copy.errorMessage);
      setStatus("error");
    }
  };

  const resetForm = () => {
    startedAtRef.current = Date.now();
    setFormError(null);
    setFieldErrors({});
    setStatus("idle");
  };

  if (status === "success") {
    return (
      <div className="factory-contact-plate factory-contact-result">
        <div
          ref={successRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className="factory-focus flex flex-col items-start gap-4 p-6 sm:p-8"
        >
          <span className="factory-contact-result-mark" aria-hidden="true" />
          <p className="factory-eyebrow">{copy.successTitle}</p>
          <p className="max-w-sm text-base leading-7 text-(--text-secondary)">
            {copy.successBody}
            {copy.responseNote ? ` ${copy.responseNote}` : ""}
          </p>
          <button type="button" onClick={resetForm} className="factory-contact-reset factory-focus">
            {copy.resetLabel}
          </button>
        </div>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      aria-busy={submitting}
      className="factory-contact-plate"
    >
      <div className="factory-contact-plate-head">
        <span className="factory-eyebrow">{copy.eyebrow}</span>
        <span className="factory-contact-plate-tag" aria-hidden="true">
          {copy.plateTag}
        </span>
      </div>

      <div className="factory-contact-fields">
        <div className="factory-contact-row">
          <Field
            name="name"
            error={fieldErrors.name}
            onInput={() => clearFieldError("name")}
            maxLength={CONTACT_LIMITS.name.max}
            required
          />
          <Field
            name="phone"
            type="tel"
            inputMode="tel"
            error={fieldErrors.phone}
            onInput={() => clearFieldError("phone")}
            maxLength={CONTACT_LIMITS.phone.max}
            required
          />
        </div>

        {contact.collectEmail && (
          <Field
            name="email"
            type="email"
            inputMode="email"
            error={fieldErrors.email}
            onInput={() => clearFieldError("email")}
            maxLength={CONTACT_LIMITS.email.max}
          />
        )}

        <Field
          name="message"
          multiline
          error={fieldErrors.message}
          onInput={(event) => {
            clearFieldError("message");
            setMessageLength(event.currentTarget.value.length);
          }}
          maxLength={CONTACT_LIMITS.message.max}
          required
          meta={
            messageLength > CONTACT_LIMITS.message.max * 0.6
              ? `${messageLength} / ${CONTACT_LIMITS.message.max}`
              : undefined
          }
        />

        {/*
          Honeypot: off-screen, unlabelled for assistive tech, skipped by the
          keyboard. Humans never see or reach it; scripts fill it in.
        */}
        <div className="factory-contact-honeypot" aria-hidden="true">
          <label htmlFor={CONTACT_HONEYPOT_FIELD}>Reference code</label>
          <input
            id={CONTACT_HONEYPOT_FIELD}
            name={CONTACT_HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>
      </div>

      <div className="factory-contact-plate-foot">
        {/*
          Progress: one finite accent sweep across the foot rule. Indeterminate
          looping animation is deliberately avoided — the disabled button,
          "sending" label and aria-busy carry the state.
        */}
        {submitting && <span className="factory-contact-progress" aria-hidden="true" />}

        <div className="factory-contact-status" aria-live="polite">
          {status === "error" && formError ? (
            <p className="factory-contact-error" role="alert">
              {formError}
            </p>
          ) : (
            <p className="factory-contact-note">{copy.note}</p>
          )}
        </div>

        <SubmitButton variant="primary" disabled={submitting} className="w-full sm:w-auto">
          <span>{submitting ? copy.submittingLabel : copy.submitLabel}</span>
          <span aria-hidden="true">{submitting ? "…" : "→"}</span>
        </SubmitButton>
      </div>
    </form>
  );
}

/**
 * One labelled field. Visible label always, error text bound to the control
 * through aria-describedby, invalid state exposed with aria-invalid.
 */
function Field({
  name,
  type = "text",
  inputMode,
  multiline = false,
  required = false,
  maxLength,
  error,
  onInput,
  meta,
}: {
  name: ContactFieldName;
  type?: string;
  inputMode?: "tel" | "email" | "text";
  multiline?: boolean;
  required?: boolean;
  maxLength: number;
  error?: string;
  onInput: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  meta?: ReactNode;
}) {
  const field = contact.form.fields[name];
  const id = `contact-${name}`;
  const errorId = `${id}-error`;

  const shared = {
    id,
    name,
    required,
    maxLength,
    placeholder: field.placeholder,
    autoComplete: field.autoComplete,
    onInput,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: "factory-contact-input factory-focus",
  } as const;

  return (
    <div className="factory-contact-field">
      <div className="factory-contact-label-row">
        <label htmlFor={id} className="factory-contact-label">
          <span className="factory-contact-label-index" aria-hidden="true">
            {field.index}
          </span>
          {field.label}
          {required && (
            <span className="factory-contact-required" aria-hidden="true">
              {contact.form.requiredMarker}
            </span>
          )}
          {!required && field.optionalLabel && (
            <span className="factory-contact-optional">{field.optionalLabel}</span>
          )}
        </label>
        {meta && (
          <span className="factory-contact-meta-count" aria-hidden="true">
            {meta}
          </span>
        )}
      </div>

      {multiline ? (
        <textarea {...shared} rows={5} />
      ) : (
        <input {...shared} type={type} inputMode={inputMode} />
      )}

      {error && (
        <p id={errorId} className="factory-contact-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
