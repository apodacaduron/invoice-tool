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

    // Layout constants (tweak these to taste)
    const margin = 60;
    const marginBottom = 80;
    const topGap = 120; // initial title space
    const sectionGap = 32;
    const rowGap = 10;
    const lineGap = 4;
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
      drawText(page, "INVOICE", margin, y, 36, { bold: true });

      // move the right-side meta block left for breathing room
      const halfWidth = usableWidth / 2;
      const metaXLabel = margin + halfWidth;
      const metaXValue = PAGE_W - margin;

      // ID
      drawText(page, "ID", metaXLabel, y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53) });
      drawText(page, invoice.id || "-", metaXValue, y, 10, { align: "right" });

      y -= 22;

      // Date
      drawText(page, "Date", metaXLabel, y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53) });
      drawText(page, formatDate(invoice.date), metaXValue, y, 10, { align: "right" });

      y -= 22;

      // Due date
      drawText(page, "Invoice due", metaXLabel, y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53) });
      drawText(page, formatDate(invoice.due_date), metaXValue, y, 10, { align: "right" });

      y -= sectionGap;

      // subtle divider
      page.drawLine({
        start: { x: margin, y },
        end: { x: PAGE_W - margin, y },
        thickness: 0.6,
        color: rgb(0.93, 0.93, 0.95),
      });

      y -= 18;
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
      drawText(page, "From", margin, y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53) });
      drawText(page, "Bill to", margin + halfWidth, y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53) });
      y -= 16;

      const leftLines = wrapText(invoice.seller_info || "-", halfWidth - 8, 12);
      const rightLines = wrapText(invoice.buyer_info || "-", halfWidth - 8, 12);
      const maxLines = Math.max(leftLines.length, rightLines.length);

      // page break check
      const required = maxLines * normalLineHeight + 8;
      if (y - required < marginBottom) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        pages.push(page);
        y = PAGE_H - margin;
      }

      for (let i = 0; i < maxLines; i++) {
        drawText(page, leftLines[i] || "", margin, y, 12);
        drawText(page, rightLines[i] || "", margin + halfWidth, y, 12);
        y -= xxsLineHeight;
      }
      y -= sectionGap - 6;
    };

    const drawTableHeader = () => {
      drawText(page, "Description", colX[0], y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53) });
      drawText(page, "Hours", colX[1] + colWidths[1] - 6, y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53), align: "right" });
      drawText(page, "Rate", colX[2] + colWidths[2] - 6, y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53), align: "right" });
      drawText(page, "Amount", colX[3] + colWidths[3] - 6, y, 12, { bold: true, color: rgb(0.45, 0.47, 0.53), align: "right" });
      y -= 12;
      page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 0.5, color: rgb(0.90, 0.90, 0.93) });
      y -= 14;
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
      const qtyText = typeof it.quantity !== "undefined" ? String(it.quantity) : "-";
      const rateText = `$${(Number(it.rate) || 0).toFixed(2)}`;
      const amount = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
      const amountText = `$${amount.toFixed(2)}`;

      const descMaxWidth = colWidths[0] - 6;
      const descLines = wrapText(it.description || "-", descMaxWidth, 12);
      const rowHeight = Math.max(descLines.length * smallLineHeight, smallLineHeight) + rowGap;

      // page break if needed
      if (y - rowHeight < marginBottom + 80) {
        addNewPageAndHeader(true);
      }

      // vertical centering
      const fontSize = 12;
      const totalTextHeight = descLines.length * smallLineHeight;
      const offsetY = (rowHeight - totalTextHeight) / 2 + fontSize / 2; // adjust for baseline

      // draw description lines
      for (let li = 0; li < descLines.length; li++) {
        drawText(page, descLines[li], colX[0], y - offsetY - li * smallLineHeight, 12);
      }

      // draw numeric columns, vertically centered too
      const numericY = y - rowHeight / 2 + smallLineHeight / 2; // center first line
      drawText(page, qtyText, colX[1] + colWidths[1] - 6, numericY, 12, { align: "right" });
      drawText(page, rateText, colX[2] + colWidths[2] - 6, numericY, 12, { align: "right" });
      drawText(page, amountText, colX[3] + colWidths[3] - 6, numericY, 12, { align: "right" });

      // move cursor down for next row
      y -= rowHeight;

      // separator
      page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 0.35, color: rgb(0.94, 0.94, 0.96) });
      y -= 8;

      total += amount;
    }

    // ensure space for total box
    // --- TOTAL BOX SETUP ---
    const totalBoxH = 68;
    const paddingAfterRow = 12; // space between last row and total box

    // Check if total box fits on current page
    if (y - totalBoxH - paddingAfterRow < marginBottom) {
      addNewPageAndHeader(true);
    }

    // move cursor down a bit to leave space after last row
    y -= paddingAfterRow;

    // position of the box
    const boxW = 320;
    const boxX = PAGE_W - margin - boxW;
    const boxY = y - totalBoxH;

    // draw rectangle
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: totalBoxH,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.9, 0.9, 0.93),
      borderWidth: 0.6,
    });

    // draw "Total" label
    drawText(page, "Total", boxX + 18, boxY + totalBoxH - 28, 14, { bold: true, color: rgb(0.45, 0.47, 0.53) });

    // draw amount
    drawText(
      page,
      `$${total.toFixed(2)} ${invoice.currency || "USD"}`,
      boxX + boxW - 18,
      boxY + totalBoxH - 30,
      18,
      { bold: true, align: "right" }
    );

    // move cursor below total box for any notes or footer
    y = boxY - 16; // space after box

    // notes
    let notesY = boxY - 26;
    if (invoice.notes) {
      const noteLines = wrapText(invoice.notes, usableWidth, 12);
      // page break if notes don't fit
      if (notesY - noteLines.length * smallLineHeight < marginBottom) {
        addNewPageAndHeader(false);
        notesY = y;
      }
      drawText(page, "Notes", margin, notesY, 12, { bold: true, color: rgb(0.45, 0.47, 0.53) });
      notesY -= 18;
      for (const nl of noteLines) {
        drawText(page, nl, margin, notesY, 12);
        notesY -= smallLineHeight;
        if (notesY < marginBottom) {
          addNewPageAndHeader(false);
          notesY = y;
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
