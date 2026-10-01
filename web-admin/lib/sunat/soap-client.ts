import AdmZip from "adm-zip";
import { SUNAT_CONFIG } from "./config";

export interface SunatSoapResponse {
  success: boolean;
  cdrCode?: string;
  cdrDesc?: string;
  cdrXml?: string;
  faultCode?: string;
  faultString?: string;
}

export async function sendInvoiceToSunat(
  signedXml: string,
  voucherNumber: string,
  tipoDocumento: "boleta" | "factura"
): Promise<SunatSoapResponse> {
  const tipoCpe = tipoDocumento === "factura" ? "01" : "03";
  const baseName = `${SUNAT_CONFIG.ruc}-${tipoCpe}-${voucherNumber}`;
  const zipFileName = `${baseName}.zip`;
  const xmlFileName = `${baseName}.xml`;

  // 1. Comprimir XML firmado en ZIP
  const zip = new AdmZip();
  zip.addFile(xmlFileName, Buffer.from(signedXml, "utf-8"));
  const zipBuffer = zip.toBuffer();
  const base64Zip = zipBuffer.toString("base64");

  // 2. Determinar credenciales y endpoint según ambiente
  const isBeta = SUNAT_CONFIG.ambiente === "beta";
  const endpoint = isBeta
    ? "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService"
    : "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService";

  const username = isBeta
    ? `${SUNAT_CONFIG.ruc}MODDATOS`
    : `${SUNAT_CONFIG.ruc}${SUNAT_CONFIG.usuarioSol}`;

  const password = isBeta ? "MODDATOS" : SUNAT_CONFIG.claveSol;

  // 3. Construir sobre SOAP con autenticación WS-Security
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe"
                  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendBill>
      <fileName>${zipFileName}</fileName>
      <contentFile>${base64Zip}</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        SOAPAction: "urn:sendBill",
      },
      body: soapEnvelope,
    });

    const responseText = await res.text();

    // 4. Si la respuesta contiene applicationResponse (CDR válido)
    const appResponseMatch = responseText.match(
      /<applicationResponse>([^<]+)<\/applicationResponse>/
    );

    if (appResponseMatch) {
      try {
        const cdrZip = new AdmZip(Buffer.from(appResponseMatch[1], "base64"));
        const cdrEntry = cdrZip
          .getEntries()
          .find((e) => e.entryName.endsWith(".xml"));

        if (cdrEntry) {
          const cdrXml = cdrEntry.getData().toString("utf-8");
          const descMatch =
            cdrXml.match(
              /<cbc:Description><!\[CDATA\[(.*?)\]\]><\/cbc:Description>/
            ) || cdrXml.match(/<cbc:Description>([^<]+)<\/cbc:Description>/);
          const codeMatch = cdrXml.match(
            /<cbc:ResponseCode>([^<]+)<\/cbc:ResponseCode>/
          );

          const cdrCode = codeMatch ? codeMatch[1].trim() : "0";
          const cdrDesc = descMatch
            ? descMatch[1].trim()
            : "Comprobante aceptado por SUNAT";

          return {
            success: cdrCode === "0",
            cdrCode,
            cdrDesc,
            cdrXml,
          };
        }
      } catch (zipErr: any) {
        console.warn("No se pudo descomprimir el CDR de respuesta:", zipErr.message);
      }
    }

    // 5. Si SUNAT devolvió un SOAP Fault (Rechazo o Error)
    const faultCodeMatch = responseText.match(/<faultcode>([^<]+)<\/faultcode>/);
    const faultStringMatch = responseText.match(/<faultstring>([^<]+)<\/faultstring>/);

    if (faultCodeMatch || faultStringMatch) {
      const faultCode = faultCodeMatch ? faultCodeMatch[1].trim() : "Error";
      const faultString = faultStringMatch ? faultStringMatch[1].trim() : "Error en servidor SUNAT";

      return {
        success: false,
        faultCode,
        faultString,
        cdrCode: faultCode,
        cdrDesc: faultString,
      };
    }

    return {
      success: false,
      cdrDesc: `Respuesta desconocida de SUNAT (HTTP ${res.status}): ${responseText.substring(0, 200)}`,
    };
  } catch (netErr: any) {
    return {
      success: false,
      cdrDesc: `Error de red al conectar con SUNAT: ${netErr.message}`,
    };
  }
}
