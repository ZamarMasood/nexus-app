import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getInvoiceById, updateInvoice } from '@/lib/db/invoices';
import { getClientById } from '@/lib/db/clients';
import { supabase } from '@/lib/supabase';
import { InvoicePDFTemplate } from '@/components/invoices/InvoicePDFTemplate';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { invoiceId?: string };
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const invoice = await getInvoiceById(invoiceId);
    if (!invoice.client_id) {
      return NextResponse.json({ error: 'Invoice has no associated client' }, { status: 400 });
    }

    const client = await getClientById(invoice.client_id);

    // Cast needed: renderToBuffer expects DocumentProps element; our wrapper satisfies the contract at runtime
    const element = React.createElement(InvoicePDFTemplate, { invoice, client }) as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(element);

    const fileName = `${invoiceId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    const pdf_url = urlData.publicUrl;
    const updated = await updateInvoice(invoiceId, { pdf_url });

    return NextResponse.json({ pdf_url, invoice: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
