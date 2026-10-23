
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { MANDATORY_DISCLOSURE } from "@/lib/site";

type DisclosureField = {
  label: string;
  value: string;
};

type DisclosureContentResponse = {
  success?: boolean;
  data?: {
    generalInformation?: {
      fields?: DisclosureField[];
    };
  } | null;
};

type Props = {
  fallbackRows: readonly DisclosureField[];
};

export default function GeneralInformationRows({
  fallbackRows,
}: Props): ReactNode {
  const [rows, setRows] = useState<readonly DisclosureField[]>(fallbackRows);

  useEffect(() => {
    let active = true;

    async function loadContent() {
      try {
        const response = await fetch("/api/mandatory-disclosure/content", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result =
          (await response.json()) as DisclosureContentResponse;

        const fields = result.data?.generalInformation?.fields;

        if (active && result.success && Array.isArray(fields)) {
          setRows(fields);
        }
      } catch (error) {
        console.error(
          "Unable to load mandatory disclosure general information:",
          error
        );
      }
    }

    void loadContent();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {rows.map((row, index) => (
        <tr key={`${row.label}-${index}`}>
          <th scope="row" className="text-left">
            {row.label}
          </th>
          <td>{row.value}</td>
        </tr>
      ))}
    </>
  );
}
