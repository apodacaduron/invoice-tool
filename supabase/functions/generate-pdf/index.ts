// Edge function: generate-invoice (refactored, DRY, same output)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib';

/* -------------------------------------------------------------------------- */
/* Config                                                                      */
/* -------------------------------------------------------------------------- */

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Expose-Headers": "Content-Disposition",
};

const PAGE = { W: 768, H: 1103 };
const MARGIN = { top: 72, bottom: 80 };
const GAPS = { section: 40, row: 8, line: 18 };

const COLORS = {
  text: rgb(0.2, 0.2, 0.2),
  muted: rgb(74 / 255, 84 / 255, 99 / 255),
  tableHeader: rgb(109 / 255, 115 / 255, 128 / 255),
  header: rgb(0.11, 0.11, 0.11),
  lightRow: rgb(248 / 255, 251 / 255, 252 / 255),
  lightBorder: rgb(231 / 255, 230 / 255, 235 / 255),
  darkBorder: rgb(208 / 255, 212 / 255, 219 / 255),
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const formatDate = (value?: string | Date) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
};

function formatNumberToCurrency(
  value: any,
  locale: string = "en-US",
  currency: string = "USD"
): string {
  // Convert the value to a number and default to 0 if it's invalid
  const numericValue = isNaN(Number(value)) ? 0 : Number(value);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(numericValue);
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { uuid } = await req.json().catch(() => ({}));
    if (!uuid) {
      return new Response(JSON.stringify({ error: "Missing invoice UUID" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", uuid)
      .single();

    if (error || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    /* ---------------------------------------------------------------------- */
    /* PDF Setup                                                               */
    /* ---------------------------------------------------------------------- */

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const usableWidth = PAGE.W - MARGIN.top * 2;
    const colW = [
      usableWidth * 0.56,
      usableWidth * 0.12,
      usableWidth * 0.16,
      usableWidth * 0.16,
    ];
    const colX = colW.reduce<number[]>(
      (acc, w, i) => [...acc, (acc[i - 1] ?? MARGIN.top) + (i ? colW[i - 1] : 0)],
      []
    );

    let pages: any[] = [];
    let page: any;
    let y = 0;

    const newPage = () => {
      page = pdf.addPage([PAGE.W, PAGE.H]);
      pages.push(page);
      y = PAGE.H - MARGIN.top;
    };

    newPage();

    const drawText = (
      text: string,
      x: number,
      y: number,
      size = 12,
      {
        bold = false,
        color = COLORS.text,
        align = "left",
      }: { bold?: boolean; color?: any; align?: "left" | "right" } = {}
    ) => {
      const f = bold ? fontBold : font;
      const w = f.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: align === "right" ? x - w : x,
        y,
        size,
        font: f,
        color,
      });
    };

    const wrapText = (text: string, maxWidth: number, size = 12, bold = false) => {
      if (!text) return [""];
      const f = bold ? fontBold : font;
      return text.split("\n").flatMap((p) => {
        if (!p.trim()) return [""];
        const words = p.split(" ");
        let line = "";
        const lines: string[] = [];
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (f.widthOfTextAtSize(test, size) <= maxWidth) line = test;
          else {
            lines.push(line);
            line = w;
          }
        }
        if (line) lines.push(line);
        return lines;
      });
    };

    const ensureSpace = (h: number, repeatHeader = false) => {
      if (y - h < MARGIN.bottom) {
        newPage();
        if (repeatHeader) drawTableHeader();
      }
    };

    /* ---------------------------------------------------------------------- */
    /* Header                                                                  */
    /* ---------------------------------------------------------------------- */

    drawText("INVOICE", MARGIN.top, y, 42, { bold: true, color: COLORS.header });
    y += 18;

    const metaX = PAGE.W - MARGIN.top;
    [["INVOICE ID", invoice.id], ["ISSUE DATE", formatDate(invoice.date)], ["DUE DATE", formatDate(invoice.due_date)]].forEach(
      ([label, value]) => {
        drawText(label as string, PAGE.W / 2, y, 9, { bold: true, color: COLORS.muted });
        drawText(String(value ?? "-"), metaX, y, 10, { align: "right", color: COLORS.text });
        y -= 18;
      }
    );

    y -= GAPS.section;

    /* ---------------------------------------------------------------------- */
    /* From / Bill To                                                          */
    /* ---------------------------------------------------------------------- */

    const half = usableWidth / 2;
    drawText("FROM", MARGIN.top, y, 9, { bold: true, color: COLORS.muted });
    drawText("BILL TO", MARGIN.top + half, y, 9, { bold: true, color: COLORS.text });
    y -= 18;

    const left = wrapText(invoice.seller_info || "-", half - 8, 11);
    const right = wrapText(invoice.buyer_info || "-", half - 8, 11);
    ensureSpace(Math.max(left.length, right.length) * GAPS.line);

    left.forEach((l, i) => {
      drawText(l, MARGIN.top, y, 11);
      drawText(right[i] || "", MARGIN.top + half, y, 11);
      y -= GAPS.line;
    });

    y -= GAPS.section;

    /* ---------------------------------------------------------------------- */
    /* Table                                                                   */
    /* ---------------------------------------------------------------------- */

    const drawTableHeader = () => {
      ["DESCRIPTION", "HOURS", "RATE", "AMOUNT"].forEach((t, i) =>
        drawText(t, i ? colX[i] + colW[i] - 6 : colX[0], y, 9, {
          bold: true,
          align: i ? "right" : "left",
          color: COLORS.tableHeader,
        })
      );
      y -= 12;
      page.drawLine({
        start: { x: MARGIN.top, y },
        end: { x: PAGE.W - MARGIN.top, y },
        thickness: 1.5,
        color: COLORS.darkBorder,
      });
      y -= 12;
    };

    drawTableHeader();

    let total = 0;

    invoice.items?.forEach((it: any, i: number) => {
      const amount = (it.quantity || 0) * (it.rate || 0);
      const desc = wrapText(it.description || "-", colW[0] - 6, 11);
      const rowH = Math.max(desc.length * GAPS.line, GAPS.line) + GAPS.row;

      ensureSpace(rowH + 80, true);

      if (i % 2) {
        page.drawRectangle({
          x: MARGIN.top,
          y: y - rowH,
          width: usableWidth,
          height: rowH + GAPS.row,
          color: COLORS.lightRow,
        });
      }

      desc.forEach((d, j) =>
        drawText(d, colX[0] + 6, y - j * GAPS.line - 12, 11)
      );

      drawText(String(it.quantity ?? "0"), colX[1] + colW[1] - 6, y - rowH / 2, 11, { align: "right" });
      drawText(`${formatNumberToCurrency(+it.rate || 0)}`, colX[2] + colW[2] - 6, y - rowH / 2, 11, { align: "right" });
      drawText(`${formatNumberToCurrency(amount)}`, colX[3] + colW[3] - 6, y - rowH / 2, 11, {
        align: "right",
        bold: true,
      });

      y -= rowH;

      // subtle row separator
      page.drawLine({
        start: { x: MARGIN.top, y },
        end: { x: PAGE.W - MARGIN.top, y },
        thickness: 0.4,
        color: rgb(0.88, 0.88, 0.88),
      });

      y -= 8;
      total += amount;
    });

    /* ---------------------------------------------------------------------- */
    /* Total                                                                   */
    /* ---------------------------------------------------------------------- */

    ensureSpace(80, true);
    y -= 24;

    page.drawLine({
      start: { x: PAGE.W - MARGIN.top - 296, y },
      end: { x: PAGE.W - MARGIN.top, y },
      thickness: 1.5,
      color: COLORS.darkBorder,
    });

    y -= 32;
    drawText("TOTAL", PAGE.W - MARGIN.top - 280, y, 10, { bold: true, color: COLORS.muted });
    drawText(
      `${formatNumberToCurrency(total)} ${invoice.currency || "USD"}`,
      PAGE.W - MARGIN.top,
      y,
      20,
      { bold: true, align: "right" }
    );

    /* ---------------------------------------------------------------------- */
    /* Notes                                                                   */
    /* ---------------------------------------------------------------------- */

    if (invoice.notes) {
      y -= GAPS.section;
      const noteLines = wrapText(invoice.notes, usableWidth, 11);

      // Ensure space for notes header + at least one line
      ensureSpace(noteLines.length * GAPS.line + 40, false);

      drawText("ADDITIONAL NOTES", MARGIN.top, y, 9, {
        bold: true,
        color: COLORS.muted,
      });

      y -= 18;

      for (const line of noteLines) {
        // Page break mid-notes if needed
        if (y < MARGIN.bottom) {
          newPage();
          y -= 20;
        }

        drawText(line, MARGIN.top, y, 11, {
          color: COLORS.text,
        });

        y -= GAPS.line;
      }

      y -= GAPS.section;
    }


    /* ---------------------------------------------------------------------- */
    /* Footer                                                                  */
    /* ---------------------------------------------------------------------- */

    pages.forEach((p, i) =>
      p.drawText(`Page ${i + 1} of ${pages.length}`, {
        x: PAGE.W / 2 - 30,
        y: MARGIN.bottom - 28,
        size: 10,
        font,
        color: COLORS.muted,
      })
    );

    const pdfBytes = await pdf.save();
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${formatDate(invoice.date)}.pdf"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
