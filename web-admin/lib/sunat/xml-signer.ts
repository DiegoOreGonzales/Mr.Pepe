import fs from "fs";
import path from "path";
import { SignedXml } from "xml-crypto";

export interface SignedXmlResult {
  signedXml: string;
  hash: string; // DigestValue SHA-256
}

export function signUblXml(xmlContent: string): SignedXmlResult {
  // Buscar archivos de certificado y clave privada
  const certCandidates = [
    path.resolve(process.cwd(), "certs", "certificate.pem"),
    path.resolve(process.cwd(), "web-admin", "certs", "certificate.pem"),
    path.resolve(__dirname, "..", "..", "certs", "certificate.pem"),
  ];

  const keyCandidates = [
    path.resolve(process.cwd(), "certs", "private_key.pem"),
    path.resolve(process.cwd(), "web-admin", "certs", "private_key.pem"),
    path.resolve(__dirname, "..", "..", "certs", "private_key.pem"),
  ];

  const certPath = certCandidates.find((p) => fs.existsSync(p));
  const keyPath = keyCandidates.find((p) => fs.existsSync(p));

  if (!certPath || !keyPath) {
    throw new Error(
      `No se encontraron los certificados en la carpeta certs/ (buscados: certificate.pem y private_key.pem)`
    );
  }

  const certPem = fs.readFileSync(certPath, "utf-8");
  const keyPem = fs.readFileSync(keyPath, "utf-8");

  const sig = new SignedXml({
    privateKey: keyPem,
    publicCert: certPem,
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
  });

  sig.addReference({
    xpath: "/*",
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
    transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature"],
    isEmptyUri: true,
  });

  sig.computeSignature(xmlContent, {
    prefix: "ds",
    attrs: { Id: "SignSUNAT" },
    location: {
      reference: "//*[local-name(.)='ExtensionContent']",
      action: "append",
    },
  });

  const signedXml = sig.getSignedXml();

  const digestMatch = signedXml.match(/<ds:DigestValue>([^<]+)<\/ds:DigestValue>/);
  const hash = digestMatch ? digestMatch[1] : "";

  return {
    signedXml,
    hash,
  };
}
