import type {
  Business,
  ContactConfiguration,
  ContactFieldErrorCode,
  ContactFieldName,
} from "./types";

/**
 * Section 10 — Contact configuration.
 *
 * Everything the Contact section renders is either in this file or in
 * lib/business.ts. Cloning a gym means editing data, never the component:
 * headings, supporting copy, CTA label, field labels, validation wording,
 * success/error copy, the email subject pattern and the background art are
 * all addressable here.
 *
 * NO SECRETS. The Resend API key, the destination inbox and the sender
 * address are server-only environment variables — this file only records
 * which variable supplies each one. See .env.example.
 *
 * DATA STATUS: lib/business.ts now holds Gladiator Fitness Studio's real
 * researched details for the Madhapur branch (see
 * docs/gladiator-gym-research.md). Phone and address are VERIFIED_OFFICIAL;
 * opening hours are PUBLICLY_REPORTED (Sunday opening time specifically has
 * a documented source conflict — see lib/business.ts) and recommended for
 * owner confirmation before final-client production. `dataVerified: true`
 * reflects that these are real sourced business facts, not master-template
 * placeholders.
 */
export const contact: ContactConfiguration = {
  index: "10",
  eyebrow: "Contact",
  headline: "Ask us anything.",
  supporting:
    "Training, membership, or where to start — send it across and a person at the gym answers. WhatsApp is the fastest route; the form reaches the same people.",
  primaryCtaLabel: "Chat on WhatsApp",
  collectEmail: true,
  dataVerified: true,
  phoneDisplay: undefined,

  directory: {
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Address",
    unverifiedNotice:
      "Some details are publicly reported and recommended for owner confirmation before launch.",
  },

  // Structural facts about how the form behaves. Not marketing claims.
  meta: [
    { label: "Fastest channel", value: "WhatsApp" },
    { label: "Form delivery", value: "Email to the gym's inquiry inbox" },
    { label: "Collected", value: "Name, phone, message, optional email" },
  ],

  form: {
    eyebrow: "Inquiry form",
    plateTag: "10 / FORM",
    requiredMarker: "*",
    fields: {
      name: {
        index: "01",
        label: "Name",
        placeholder: "Your name",
        autoComplete: "name",
        errors: {
          required: "Enter your name.",
          tooShort: "Enter your full name.",
          tooLong: "That name is longer than the field accepts — shorten it.",
        },
      },
      phone: {
        index: "02",
        label: "Phone",
        placeholder: "Number we can reach you on",
        autoComplete: "tel",
        errors: {
          required: "Enter a phone number.",
          invalid: "Enter a phone number we can actually dial.",
          tooLong: "That phone number is too long.",
        },
      },
      email: {
        index: "03",
        label: "Email",
        optionalLabel: "Optional",
        placeholder: "So we can reply by email",
        autoComplete: "email",
        errors: {
          invalid: "Check the email address — it doesn't look right.",
          tooLong: "That email address is too long.",
        },
      },
      message: {
        index: "04",
        label: "Message",
        placeholder: "What would you like to know?",
        errors: {
          required: "Add a short message.",
          tooShort: "Add a little more detail so we can answer properly.",
          tooLong: "That's longer than the field accepts — shorten it a little.",
        },
      },
    },
    submitLabel: "Send message",
    submittingLabel: "Sending",
    note: "This form sends one email to the gym's inquiry inbox.",
    validationSummary: "Check the highlighted fields and send again.",
    successTitle: "Message sent.",
    successBody: "Your message has reached the gym. We'll get back to you.",
    // Set only if the gym can actually stand behind a response window.
    responseNote: undefined,
    resetLabel: "Send another message",
    errorMessage:
      "Something went wrong. Please try again, or contact us on WhatsApp.",
    notConfiguredMessage:
      "The message couldn't be sent right now. Please contact us on WhatsApp or by phone.",
    throttledMessage:
      "That's a few messages in a short window. Please wait a moment, or contact us on WhatsApp.",
  },

  delivery: {
    subjectTemplate: "New website enquiry — {name}",
    sourceLabel: "Website contact form",
    recipientEnvVar: "CONTACT_TO_EMAIL",
    senderEnvVar: "CONTACT_FROM_EMAIL",
    apiKeyEnvVar: "RESEND_API_KEY",
  },

  background: {
    // Existing project asset, reused at low opacity as equipment geometry.
    src: "/assets/education/training-intelligence-weight-plate-loading-editorial.webp",
    numeral: "10",
    edgeLabel: "Contact / Inquiry",
  },
};

export interface ContactDirectoryEntry {
  id: "phone" | "email" | "address";
  label: string;
  value: string;
  href?: string;
}

/**
 * Composes the visible contact directory from the supplied business record
 * using the labels above. Business facts are never duplicated into the Contact
 * config, and the component never reads a phone number or address out of JSX.
 * `business` is passed in rather than imported so this module stays pure data.
 */
export function contactDirectory(business: Business): ContactDirectoryEntry[] {
  const entries: ContactDirectoryEntry[] = [];

  if (business.phone) {
    entries.push({
      id: "phone",
      label: contact.directory.phoneLabel,
      value: contact.phoneDisplay ?? business.phone,
      href: `tel:${business.phone}`,
    });
  }

  if (business.email) {
    entries.push({
      id: "email",
      label: contact.directory.emailLabel,
      value: business.email,
      href: `mailto:${business.email}`,
    });
  }

  const { addressLine, locality, city, state, postalCode } = business.address;
  const address = [addressLine, locality, city, [state, postalCode].filter(Boolean).join(" ")]
    .filter((part) => Boolean(part && part.trim()))
    .join(", ");

  if (address) {
    entries.push({ id: "address", label: contact.directory.addressLabel, value: address });
  }

  return entries;
}

/**
 * Maps a validation code to configured copy. Single source of truth for both
 * the client form and the API's 4xx response body.
 */
export function contactFieldErrorMessage(
  field: ContactFieldName,
  code: ContactFieldErrorCode
): string {
  return contact.form.fields[field].errors[code] ?? contact.form.validationSummary;
}

/** Field labels handed to the email template, so email and form agree. */
export function contactEmailLabels() {
  const fields = contact.form.fields;
  return {
    name: fields.name.label,
    phone: fields.phone.label,
    email: fields.email.label,
    message: fields.message.label,
  };
}
