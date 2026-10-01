import { SUNAT_CONFIG } from "./config";
import { numberToWords } from "../numberToWords";

export interface UblItem {
  nombre: string;
  cantidad: number;
  precio: number; // Precio con IGV incluido
}

export interface UblInvoiceData {
  voucherNumber: string; // ej: B001-00000001
  tipoDocumento: "boleta" | "factura";
  clienteNombre: string;
  clienteDocumento: string;
  items: UblItem[];
  total: number;
  fecha?: Date;
}

export function buildUbl21InvoiceXml(data: UblInvoiceData): string {
  const tipoCpe = data.tipoDocumento === "factura" ? "01" : "03";
  const fecha = data.fecha ? new Date(data.fecha) : new Date();
  const fechaStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(fecha);
  const horaStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(fecha);

  const doc = (data.clienteDocumento || "").trim();
  let tipoDocIdentidad = "0"; // Consumidor final sin documento
  if (!doc || doc === "00000000" || doc === "0") {
    tipoDocIdentidad = "0";
  } else if (doc.length === 8) {
    tipoDocIdentidad = "1"; // DNI
  } else if (doc.length === 11) {
    tipoDocIdentidad = "6"; // RUC
  }

  const clienteNombre = (data.clienteNombre || "Clientes Varios").trim();
  const clienteDocumento = tipoDocIdentidad === "0" ? "00000000" : doc;

  const total = Number(data.total.toFixed(2));
  const gravada = Number((total / 1.18).toFixed(2));
  const igv = Number((total - gravada).toFixed(2));
  const montoLetras = numberToWords(total);

  // Asegurar que haya al menos un ítem
  const items = data.items && data.items.length > 0
    ? data.items
    : [{ nombre: "Consumo Pollería", cantidad: 1, precio: total }];

  const linesXml = items
    .map((item, idx) => {
      const cantidad = Number(item.cantidad) || 1;
      const precioConIgv = Number(item.precio) || 0;
      const subtotalConIgv = Number((precioConIgv * cantidad).toFixed(2));
      const subtotalSinIgv = Number((subtotalConIgv / 1.18).toFixed(2));
      const itemIgv = Number((subtotalConIgv - subtotalSinIgv).toFixed(2));
      const valorUnitario = Number((precioConIgv / 1.18).toFixed(2));

      return `  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="NIU">${cantidad}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">${subtotalSinIgv.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">${precioConIgv.toFixed(2)}</cbc:PriceAmount>
        <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="PEN">${itemIgv.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="PEN">${subtotalSinIgv.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="PEN">${itemIgv.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:Percent>18.00</cbc:Percent>
          <cbc:TaxExemptionReasonCode>10</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description><![CDATA[${item.nombre}]]></cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">${valorUnitario.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${data.voucherNumber}</cbc:ID>
  <cbc:IssueDate>${fechaStr}</cbc:IssueDate>
  <cbc:IssueTime>${horaStr}</cbc:IssueTime>
  <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" listID="0101" name="Tipo de Operacion">${tipoCpe}</cbc:InvoiceTypeCode>
  <cbc:Note languageLocaleID="1000">${montoLetras}</cbc:Note>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:Signature>
    <cbc:ID>${SUNAT_CONFIG.ruc}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${SUNAT_CONFIG.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${SUNAT_CONFIG.razonSocial}]]></cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#SignSUNAT</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${SUNAT_CONFIG.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${SUNAT_CONFIG.nombreComercial}]]></cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${SUNAT_CONFIG.razonSocial}]]></cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:ID>${SUNAT_CONFIG.ubigeo}</cbc:ID>
          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${SUNAT_CONFIG.direccion}]]></cbc:Line>
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode>PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${tipoDocIdentidad}">${clienteDocumento}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${clienteNombre}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentTerms>
    <cbc:ID>FormaPago</cbc:ID>
    <cbc:PaymentMeansID>Contado</cbc:PaymentMeansID>
  </cac:PaymentTerms>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${igv.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${gravada.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${igv.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">${gravada.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${linesXml}
</Invoice>`;
}
