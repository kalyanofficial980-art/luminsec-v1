export type ReportFindingForAction = {
  title: string;
  severity?: string | null;
  category?: string | null;
  description?: string | null;
  recommendation?: string | null;
};

export type ReportActionItem = {
  priority: "urgent" | "important" | "improvement";
  title: string;
  reason: string;
  steps: string[];
  owner: string;
  effort: "Low" | "Medium" | "High";
};

function lower(value?: string | null) {
  return String(value ?? "").toLowerCase();
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function createAction(
  priority: ReportActionItem["priority"],
  title: string,
  reason: string,
  steps: string[],
  owner = "Website developer / hosting provider",
  effort: ReportActionItem["effort"] = "Medium",
): ReportActionItem {
  return {
    priority,
    title,
    reason,
    steps,
    owner,
    effort,
  };
}

function dedupeActions(actions: ReportActionItem[]) {
  const seen = new Set<string>();

  return actions.filter((action) => {
    const key = action.title.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildReportActionPlan(findings: ReportFindingForAction[]) {
  const actions: ReportActionItem[] = [];

  for (const finding of findings) {
    const text = `${lower(finding.title)} ${lower(finding.description)} ${lower(finding.recommendation)}`;

    if (hasAny(text, ["not using https", "https", "tls", "ssl"])) {
      actions.push(
        createAction(
          "urgent",
          "Fix HTTPS and redirect configuration",
          "HTTPS is a basic trust and transport security signal for visitors.",
          [
            "Confirm the website has a valid TLS certificate.",
            "Redirect HTTP traffic to HTTPS.",
            "Check the final website URL after redirect.",
            "Run a fresh VeyraSec scan after changes.",
          ],
          "Hosting provider / developer",
          "Medium",
        ),
      );
    }

    if (hasAny(text, ["strict-transport-security", "hsts"])) {
      actions.push(
        createAction(
          "important",
          "Enable HSTS after HTTPS is stable",
          "HSTS helps browsers keep using HTTPS for future visits.",
          [
            "Confirm all pages and subdomains work on HTTPS.",
            "Add Strict-Transport-Security header.",
            "Start with safe max-age value, then increase after testing.",
            "Rerun the scan and confirm HSTS appears.",
          ],
          "Developer / hosting provider",
          "Medium",
        ),
      );
    }

    if (hasAny(text, ["content security policy", "csp"])) {
      actions.push(
        createAction(
          "important",
          "Add a tested Content Security Policy",
          "CSP helps reduce browser-side injection and content loading risk.",
          [
            "List trusted script, style, image, and font sources.",
            "Start with Content-Security-Policy-Report-Only if unsure.",
            "Fix blocked resources carefully.",
            "Move to enforced CSP after testing.",
          ],
          "Developer",
          "High",
        ),
      );
    }

    if (hasAny(text, ["clickjacking", "x-frame-options", "frame-ancestors"])) {
      actions.push(
        createAction(
          "important",
          "Add clickjacking protection",
          "Frame protection helps prevent the website from being embedded in unwanted pages.",
          [
            "Add X-Frame-Options: DENY or SAMEORIGIN.",
            "Alternatively configure CSP frame-ancestors.",
            "Test pages that intentionally need iframe embedding.",
            "Rerun scan after deployment.",
          ],
          "Developer",
          "Low",
        ),
      );
    }

    if (hasAny(text, ["x-content-type-options", "nosniff"])) {
      actions.push(
        createAction(
          "improvement",
          "Add X-Content-Type-Options nosniff",
          "This header reduces MIME sniffing behavior in browsers.",
          [
            "Add X-Content-Type-Options: nosniff.",
            "Deploy through hosting/server/header settings.",
            "Verify header appears in public response.",
          ],
          "Developer / hosting provider",
          "Low",
        ),
      );
    }

    if (hasAny(text, ["referrer policy", "referrer-policy"])) {
      actions.push(
        createAction(
          "improvement",
          "Add a Referrer-Policy header",
          "This improves privacy by controlling how much URL information is shared with other websites.",
          [
            "Add Referrer-Policy: strict-origin-when-cross-origin.",
            "Use a stricter policy if the business requires it.",
            "Rerun scan and confirm the header appears.",
          ],
          "Developer",
          "Low",
        ),
      );
    }

    if (hasAny(text, ["permissions policy", "permissions-policy"])) {
      actions.push(
        createAction(
          "improvement",
          "Add a Permissions-Policy header",
          "This limits unused browser features like camera, microphone, geolocation, or payment.",
          [
            "Identify browser features the website does not use.",
            "Add Permissions-Policy to disable unused sensitive features.",
            "Test website functionality after deployment.",
          ],
          "Developer",
          "Low",
        ),
      );
    }

    if (hasAny(text, ["privacy policy"])) {
      actions.push(
        createAction(
          "important",
          "Add a clear privacy policy link",
          "A visible privacy policy improves customer trust and explains data handling.",
          [
            "Create a privacy policy page.",
            "Add a footer or navigation link named Privacy Policy.",
            "Mention contact forms, analytics, cookies, and data use where applicable.",
            "Ask a legal professional for compliance-specific wording when needed.",
          ],
          "Business owner + developer",
          "Medium",
        ),
      );
    }

    if (
      hasAny(text, ["terms link", "terms of service", "terms and conditions"])
    ) {
      actions.push(
        createAction(
          "improvement",
          "Add terms or service conditions",
          "Terms help visitors understand service rules, limitations, and business conditions.",
          [
            "Create terms or terms and conditions page.",
            "Add it to footer or navigation.",
            "Keep wording clear and relevant to the business.",
          ],
          "Business owner",
          "Medium",
        ),
      );
    }

    if (hasAny(text, ["contact signal", "contact page", "contact link"])) {
      actions.push(
        createAction(
          "important",
          "Add visible contact details",
          "Visitors trust websites more when contact details are easy to find.",
          [
            "Add a Contact page or clear footer contact section.",
            "Include email, phone, WhatsApp, form, or address where relevant.",
            "Make sure contact forms are working.",
          ],
          "Business owner + developer",
          "Low",
        ),
      );
    }

    if (hasAny(text, ["robots.txt"])) {
      actions.push(
        createAction(
          "improvement",
          "Add robots.txt",
          "robots.txt helps search engines understand allowed crawling paths.",
          [
            "Create /robots.txt.",
            "Allow public pages that should be crawled.",
            "Reference sitemap.xml if available.",
          ],
          "Developer",
          "Low",
        ),
      );
    }

    if (hasAny(text, ["sitemap"])) {
      actions.push(
        createAction(
          "improvement",
          "Add sitemap.xml",
          "A sitemap helps search engines discover important public pages.",
          [
            "Create /sitemap.xml.",
            "Include important public pages.",
            "Reference sitemap in robots.txt.",
          ],
          "Developer",
          "Low",
        ),
      );
    }

    if (hasAny(text, ["server technology", "x-powered-by", "exposed"])) {
      actions.push(
        createAction(
          "improvement",
          "Reduce technology disclosure headers",
          "Unnecessary technology headers can reveal platform details.",
          [
            "Hide X-Powered-By if possible.",
            "Reduce server version details where hosting allows it.",
            "Keep this as a low-priority hardening task.",
          ],
          "Developer / hosting provider",
          "Low",
        ),
      );
    }

    if (hasAny(text, ["cookie", "secure flag", "httponly", "samesite"])) {
      actions.push(
        createAction(
          "important",
          "Review cookie security attributes",
          "Cookies should use safer attributes when they are sensitive or session-related.",
          [
            "Set Secure for HTTPS-only cookies.",
            "Set HttpOnly for sensitive cookies.",
            "Set SameSite=Lax or Strict where appropriate.",
            "Test login and form behavior after changes.",
          ],
          "Developer",
          "Medium",
        ),
      );
    }
  }

  const deduped = dedupeActions(actions);

  if (deduped.length === 0) {
    return [
      createAction(
        "improvement",
        "Review findings and rerun scan",
        "No specific automated action pattern was detected, but the report still needs review.",
        [
          "Read every finding in the report.",
          "Ask the developer to apply relevant recommendations.",
          "Run a fresh scan after changes.",
          "Use comparison page to show before-after progress.",
        ],
        "Business owner + developer",
        "Medium",
      ),
    ];
  }

  return deduped;
}

export function actionPriorityRank(priority: ReportActionItem["priority"]) {
  if (priority === "urgent") return 1;
  if (priority === "important") return 2;
  return 3;
}

export function groupActionsByPriority(actions: ReportActionItem[]) {
  const sorted = [...actions].sort(
    (a, b) => actionPriorityRank(a.priority) - actionPriorityRank(b.priority),
  );

  return {
    urgent: sorted.filter((action) => action.priority === "urgent"),
    important: sorted.filter((action) => action.priority === "important"),
    improvement: sorted.filter((action) => action.priority === "improvement"),
  };
}
