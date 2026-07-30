/**
 * Utility helper to export JavaScript objects/arrays into CSV, JSON, or TXT log files.
 * Triggers browser file download automatically.
 */
export function downloadData<T extends Record<string, any>>(
  data: T[],
  filename: string,
  format: "csv" | "json" | "txt",
) {
  let content = "";
  let mimeType = "text/plain";
  const extension = format;

  if (format === "json") {
    content = JSON.stringify(data, null, 2);
    mimeType = "application/json";
  } else if (format === "csv") {
    mimeType = "text/csv";
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const val = row[header] ?? "";
              const escaped = String(val).replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(","),
        ),
      ];
      content = csvRows.join("\n");
    }
  } else if (format === "txt") {
    mimeType = "text/plain";
    content = data
      .map((row, index) => {
        const lines = Object.entries(row)
          .map(([k, v]) => `  ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
          .join("\n");
        return `[LOG ENTRY #${index + 1}]\n${lines}\n`;
      })
      .join("\n----------------------------------------\n");
  }

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.${extension}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
