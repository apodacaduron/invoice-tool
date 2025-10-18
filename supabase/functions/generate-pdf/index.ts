import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// Edge function: generate-invoice
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

// Minimal inline CSS for invoices
const invoiceStyles = `
  body { font-family: Arial, sans-serif; margin:0; padding:0; background:#f9fafb; color:#111827; }
  .invoice-container { max-width: 720px; margin: 24px auto; padding: 32px; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px #0001; }
  h1 { font-size: 1.8rem; margin-bottom: 8px; }
  h2 { font-size: 1.2rem; margin-top: 20px; margin-bottom: 8px; }
  .section { margin-bottom: 18px; }
  .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .items-table th, .items-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
  .total { text-align: right; font-weight: bold; margin-top: 12px; font-size: 1.1rem; }
  .subtle { color: #6b7280; font-size: 0.95rem; }
`;

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice } = await req.json();
    if (!invoice) throw new Error("Missing invoice data!");

    const { seller, buyer, items, uuid, date } = invoice;

    // Generate table rows
    const itemsRows = items
      .map((i: any) => `<tr>
        <td>${i.description}</td>
        <td>${i.qty}</td>
        <td>$${i.price.toFixed(2)}</td>
        <td>$${(i.qty * i.price).toFixed(2)}</td>
      </tr>`)
      .join("");

    const total = items.reduce((sum: number, i: any) => sum + i.qty * i.price, 0);

    // Build HTML
    const html = `
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>${invoiceStyles}</style>
        </head>
        <body>
          <div class="invoice-container">
            <h1>Invoice</h1>
            <div class="subtle">Invoice ID: ${uuid || "N/A"} | Date: ${date || new Date().toISOString().slice(0,10)}</div>

            <div class="section">
              <h2>Seller</h2>
              <div>${seller?.name || ""}</div>
              <div class="subtle">${seller?.email || ""}</div>
            </div>

            <div class="section">
              <h2>Buyer</h2>
              <div>${buyer?.name || ""}</div>
              <div class="subtle">${buyer?.email || ""}</div>
            </div>

            <div class="section">
              <h2>Items</h2>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>${itemsRows}</tbody>
              </table>
            </div>

            <div class="total">Total: $${total.toFixed(2)}</div>
          </div>
        </body>
      </html>
    `;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 793, height: 1122 },
    });
    const page = await browser.newPage();

    // Force light mode (avoid dark CSS issues)
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "24px", left: "0", right: "0", bottom: "24px" },
    });

    await browser.close();

    return new Response(pdfBuf, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice.pdf"`,
      },
    });
  } catch (e) {
    console.error("[generate-invoice error]", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
