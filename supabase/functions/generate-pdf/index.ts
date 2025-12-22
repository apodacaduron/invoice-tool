// Edge function: generate-invoice
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Expose-Headers": "Content-Disposition",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uuid } = await req.json().catch(() => ({}));
    if (!uuid) {
      return new Response(JSON.stringify({ error: "Missing invoice UUID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // fetch invoice from database
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", uuid)
      .single();

    if (error || !invoices) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invoice = invoices;

    // Create PDF doc
    const pdfDoc = await PDFDocument.create();

    // initial page size (letter-ish). You can change to [595, 842] for A4
    const PAGE_W = 768;
    const PAGE_H = 1103;

    // Fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Layout constants (refined for premium feel)
    const margin = 72; // increased from 60
    const marginBottom = 80;
    const topGap = 120;
    const sectionGap = 40; // increased breathing room
    const rowGap = 8; // tighter rows
    const lineGap = 4;
    const xxxsLineHeight = 8;
    const xxsLineHeight = 10;
    const xsLineHeight = 12;
    const smallLineHeight = 14;
    const normalLineHeight = 18;

    const usableWidth = PAGE_W - margin * 2;
    const colWidths = [usableWidth * 0.56, usableWidth * 0.12, usableWidth * 0.16, usableWidth * 0.16];
    const colX = [
      margin,
      margin + colWidths[0],
      margin + colWidths[0] + colWidths[1],
      margin + colWidths[0] + colWidths[1] + colWidths[2],
    ];

    // helpers
    const drawText = (p, text, x, y, size = 12, opts: { bold?: boolean; color?: any; align?: "left" | "right" } = {}) => {
      const { bold = false, color = rgb(0, 0, 0), align = "left" } = opts;
      const usedFont = bold ? fontBold : font;
      const textWidth = usedFont.widthOfTextAtSize(text, size);
      const posX = align === "right" ? x - textWidth : x;
      p.drawText(String(text), { x: posX, y, size, font: usedFont, color });
    };

    const measureText = (text: string, size = 12, useBold = false) => {
      const usedFont = useBold ? fontBold : font;
      return usedFont.widthOfTextAtSize(text, size);
    };

    // wrapText preserves manual newlines and hard-breaks words if needed
    const wrapText = (text: string, maxWidth: number, size = 12, bold = false) => {
      if (!text) return [""];
      const paragraphs = String(text).split("\n");
      const lines: string[] = [];
      const usedFont = bold ? fontBold : font;

      for (const para of paragraphs) {
        const words = para.split(" ").filter(Boolean);
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (usedFont.widthOfTextAtSize(test, size) <= maxWidth) {
            line = test;
          } else {
            if (line) lines.push(line);
            // hard-break if word itself is longer than maxWidth
            if (usedFont.widthOfTextAtSize(word, size) > maxWidth) {
              let chunk = "";
              for (const ch of word) {
                const t = chunk + ch;
                if (usedFont.widthOfTextAtSize(t, size) <= maxWidth) {
                  chunk = t;
                } else {
                  if (chunk) lines.push(chunk);
                  chunk = ch;
                }
              }
              if (chunk) line = chunk;
              else line = "";
            } else {
              line = word;
            }
          }
        }
        if (line) lines.push(line);
        // add blank line between paragraphs
        if (para !== paragraphs[paragraphs.length - 1]) lines.push("");
      }
      return lines.length ? lines : [""];
    };

    // page creation + cursor management
    let pages: any[] = [];
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    let y = PAGE_H - margin - 20; // starting cursor

    // draw header (invoice title + meta)
    const drawHeader = () => {
      // Larger, bolder INVOICE title
      drawText(page, "INVOICE", margin, y, 42, { bold: true, color: rgb(0.11, 0.11, 0.11) });

      // move the right-side meta block left for breathing room
      const halfWidth = usableWidth / 2;
      const metaXLabel = margin + halfWidth;
      const metaXValue = PAGE_W - margin;

      // ID - uppercase label style
      drawText(page, "ID", metaXLabel, y - 2, 9, { bold: true, color: rgb(0.4, 0.4, 0.4) });
      drawText(page, invoice.id || "-", metaXValue, y, 10, { align: "right", color: rgb(0.3, 0.3, 0.3) });

      y -= 18;

      // Date - uppercase label style
      drawText(page, "DATE", metaXLabel, y - 2, 9, { bold: true, color: rgb(0.4, 0.4, 0.4) });
      drawText(page, formatDate(invoice.date), metaXValue, y, 10, { align: "right", color: rgb(0.3, 0.3, 0.3) });

      y -= 18;

      // Due date - uppercase label style
      drawText(page, "DUE", metaXLabel, y - 2, 9, { bold: true, color: rgb(0.4, 0.4, 0.4) });
      drawText(page, formatDate(invoice.due_date), metaXValue, y, 10, { align: "right", color: rgb(0.3, 0.3, 0.3) });

      y -= sectionGap;
    };

    // helper to format date safely
    function formatDate(value?: string | Date): string {
      if (!value) return "-";

      const d = new Date(value);
      if (isNaN(d.getTime())) return "-";

      // options: short month name, day with leading zero, full year
      const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "2-digit" };
      // e.g., "Oct 19, 2025"
      return d.toLocaleDateString("en-US", options);
    }


    // draw From/BillTo
    const drawFromBill = () => {
      const halfWidth = usableWidth / 2;
      // Uppercase labels for section headers
      drawText(page, "FROM", margin, y, 9, { bold: true, color: rgb(0.4, 0.4, 0.4) });
      drawText(page, "BILL TO", margin + halfWidth, y, 9, { bold: true, color: rgb(0.4, 0.4, 0.4) });
      y -= 18;

      const leftLines = wrapText(invoice.seller_info || "-", halfWidth - 8, 11);
      const rightLines = wrapText(invoice.buyer_info || "-", halfWidth - 8, 11);
      const maxLines = Math.max(leftLines.length, rightLines.length);

      // page break check
      const required = maxLines * normalLineHeight + 8;
      if (y - required < marginBottom) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        pages.push(page);
        y = PAGE_H - margin;
      }

      for (let i = 0; i < maxLines; i++) {
        drawText(page, leftLines[i] || "", margin, y, 11, { color: rgb(0.2, 0.2, 0.2) });
        drawText(page, rightLines[i] || "", margin + halfWidth, y, 11, { color: rgb(0.2, 0.2, 0.2) });
        y -= xxxsLineHeight;
      }
      y -= sectionGap;
    };

    const drawTableHeader = () => {
      // Uppercase table headers with refined color
      drawText(page, "DESCRIPTION", colX[0], y, 9, { bold: true, color: rgb(0.35, 0.35, 0.35) });
      drawText(page, "HOURS", colX[1] + colWidths[1] - 6, y, 9, { bold: true, color: rgb(0.35, 0.35, 0.35), align: "right" });
      drawText(page, "RATE", colX[2] + colWidths[2] - 6, y, 9, { bold: true, color: rgb(0.35, 0.35, 0.35), align: "right" });
      drawText(page, "AMOUNT", colX[3] + colWidths[3] - 6, y, 9, { bold: true, color: rgb(0.35, 0.35, 0.35), align: "right" });
      y -= 10;
      // Stronger header border
      page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 1.5, color: rgb(0.7, 0.7, 0.7) });
      y -= 12;
    };

    // draw header and from/bill and table header
    drawHeader();
    drawFromBill();
    drawTableHeader();

    // function to add new page and optionally repeat the table header
    const addNewPageAndHeader = (repeatHeader = true) => {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      pages.push(page);
      y = PAGE_H - margin;
      if (repeatHeader) {
        // small header at top of new page
        drawText(page, "INVOICE", margin, y, 14, { bold: true });
        y -= 18;
        drawTableHeader();
      }
    };

    // render items
    let total = 0;
    const items = invoice.items ?? [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const qtyText = typeof it.quantity !== "undefined" && it.quantity !== null ? String(it.quantity) : "-";
      const rateText = `$${(Number(it.rate) || 0).toFixed(2)}`;
      const amount = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
      const amountText = `$${amount.toFixed(2)}`;

      const descMaxWidth = colWidths[0] - 6;
      const descLines = wrapText(it.description || "-", descMaxWidth, 12);
      const rowHeight = Math.max(descLines.length * xxxsLineHeight, xxxsLineHeight) + rowGap;

      // page break if needed
      if (y - rowHeight < marginBottom + 80) {
        addNewPageAndHeader(true);
      }

      // vertical centering
      const fontSize = 12;
      const totalTextHeight = descLines.length * xxxsLineHeight;
      const offsetY = (rowHeight - totalTextHeight) / 2 + fontSize / 2; // adjust for baseline

      // alternate row background
      if (i % 2 === 1) {
        page.drawRectangle({
          x: margin,
          y: y - rowHeight,
          width: usableWidth,
          height: rowHeight + rowGap,
          color: rgb(0.97, 0.97, 0.97), // very light gray
        });
      }

      // draw description lines
      for (let li = 0; li < descLines.length; li++) {
        drawText(page, descLines[li], colX[0], y - offsetY - li * xxxsLineHeight, 11, { color: rgb(0.2, 0.2, 0.2) });
      }

      // draw numeric columns, vertically centered too
      const rowCenterY = y - rowHeight / 2;
      drawText(page, qtyText, colX[1] + colWidths[1] - 6, rowCenterY, 11, { align: "right", color: rgb(0.2, 0.2, 0.2) });
      drawText(page, rateText, colX[2] + colWidths[2] - 6, rowCenterY, 11, { align: "right", color: rgb(0.2, 0.2, 0.2) });
      // Amount is bolder for emphasis
      drawText(page, amountText, colX[3] + colWidths[3] - 6, rowCenterY, 11, { align: "right", bold: true, color: rgb(0.1, 0.1, 0.1) });

      // move cursor down for next row
      y -= rowHeight;

      // subtle separator
      page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 0.4, color: rgb(0.88, 0.88, 0.88) });
      y -= 8;

      total += amount;
    }

    // ensure space for total section
    // --- TOTAL SECTION SETUP (border-top style instead of box) ---
    const totalSectionH = 56;
    const paddingAfterRow = 24; // increased space

    // Check if total section fits on current page
    if (y - totalSectionH - paddingAfterRow < marginBottom) {
      addNewPageAndHeader(true);
    }

    // move cursor down to leave space after last row
    y -= paddingAfterRow;

    // Draw top border for total section (full width)
    page.drawLine({
      start: { x: margin, y },
      end: { x: PAGE_W - margin, y },
      thickness: 1.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    y -= 32; // space below border

    // Position total on the right side
    const totalLabelX = PAGE_W - margin - 280;
    const totalValueX = PAGE_W - margin;

    // draw "Total" label (uppercase)
    drawText(page, "TOTAL", totalLabelX, y, 10, { bold: true, color: rgb(0.4, 0.4, 0.4) });

    // draw amount (larger, bolder)
    drawText(
      page,
      `$${total.toFixed(2)} ${invoice.currency || "USD"}`,
      totalValueX,
      y,
      20,
      { bold: true, align: "right", color: rgb(0.05, 0.05, 0.05) }
    );

    // move cursor below total section for notes
    y -= 28;

    // notes
    if (invoice.notes) {
      const noteLines = wrapText(invoice.notes, usableWidth, 11);
      // page break if notes don't fit
      if (y - noteLines.length * smallLineHeight - 20 < marginBottom) {
        addNewPageAndHeader(false);
      }
      drawText(page, "NOTES", margin, y, 9, { bold: true, color: rgb(0.4, 0.4, 0.4) });
      y -= 18;
      for (const nl of noteLines) {
        drawText(page, nl, margin, y, 11, { color: rgb(0.2, 0.2, 0.2) });
        y -= smallLineHeight;
        if (y < marginBottom) {
          addNewPageAndHeader(false);
          y = PAGE_H - margin - 40;
        }
      }
    }

    // page numbers footer
    pages.forEach((p, idx) => {
      const pageNum = idx + 1;
      const txt = `Page ${pageNum} of ${pages.length}`;
      p.drawText(txt, { x: PAGE_W / 2 - 30, y: marginBottom - 28, size: 10, font: font, color: rgb(0.45, 0.47, 0.53) });
    });

    const filename = `invoice-${formatDate(invoice.date).replace(/, /g, "-").replace(/ /g, "-")}.pdf`;

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[generate-invoice error]", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
