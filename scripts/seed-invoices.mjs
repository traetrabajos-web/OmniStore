import pg from 'pg';
import crypto from 'crypto';

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    const ordersRes = await client.query('SELECT * FROM public.orders ORDER BY id ASC');
    console.log(`Found ${ordersRes.rows.length} orders in database.`);

    let invoiceCounter = 480;
    for (const order of ordersRes.rows) {
      invoiceCounter++;
      const invoiceNumber = `FE-2026-${invoiceCounter.toString().padStart(5, '0')}`;
      const total = Number(order.total) || 0;
      const subtotal = Math.round((total / 1.19) * 100) / 100;
      const iva = Math.round((total - subtotal) * 100) / 100;

      // Generate standard DIAN CUFE SHA-384
      const cufeRaw = `${invoiceNumber}${order.order_date || '2026-10-02'}${subtotal}01${iva}040.00030.00${total}901849201${order.customer_doc || '1018472910'}CLAVETECNICA2026`;
      const cufe = crypto.createHash('sha384').update(cufeRaw).digest('hex');

      const qrCode = `NumFac=${invoiceNumber}&FecFac=${order.order_date || '2026-10-02'}&ValFac=${subtotal}&ValIva=${iva}&ValTolFac=${total}&NitFac=901849201&DocAdq=${order.customer_doc || '1018472910'}&CUFE=${cufe}`;

      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ID>${invoiceNumber}</cbc:ID>
  <cbc:UUID schemeName="CUFE-SHA384">${cufe}</cbc:UUID>
  <cbc:IssueDate>${order.order_date || '2026-10-02'}</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>OmniStore Cartagena S.A.S.</cbc:RegistrationName>
        <cbc:CompanyID>901849201-4</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${order.customer_name}</cbc:RegistrationName>
        <cbc:CompanyID>${order.customer_doc || '1018472910'}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${subtotal}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${subtotal}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

      await client.query(`
        INSERT INTO public.invoices (
          invoice_number, order_id, order_number, cufe,
          customer_name, customer_doc, customer_email, customer_phone, customer_city, customer_address,
          subtotal, iva, total, payment_method, status, dian_resolution,
          items, xml_content, qr_code_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (invoice_number) DO UPDATE SET
          cufe = EXCLUDED.cufe,
          subtotal = EXCLUDED.subtotal,
          iva = EXCLUDED.iva,
          total = EXCLUDED.total,
          xml_content = EXCLUDED.xml_content;
      `, [
        invoiceNumber,
        order.id,
        order.order_number,
        cufe,
        order.customer_name,
        order.customer_doc || '1018472910',
        order.customer_email || 'cliente@omnistore.com',
        order.customer_phone || '+57 301 630-1845',
        order.shipping_city || 'Cartagena de Indias',
        order.shipping_address || 'Bocagrande, Cartagena',
        subtotal,
        iva,
        total,
        order.payment_method || 'PSE',
        'approved',
        'Res. DIAN No. 18764000001 (Rango FE-1 a FE-50000)',
        JSON.stringify(order.items || []),
        xmlContent,
        qrCode
      ]);

      console.log(` Generated electronic invoice ${invoiceNumber} for order ${order.order_number} (CUFE: ${cufe.substring(0, 16)}...)`);
    }

    console.log(' All initial DIAN electronic invoices generated successfully in PostgreSQL!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
