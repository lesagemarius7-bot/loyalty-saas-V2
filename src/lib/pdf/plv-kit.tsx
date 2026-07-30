import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'

const styles = StyleSheet.create({
  page: {
    padding: 48,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 96,
    height: 96,
    objectFit: 'contain',
  },
  businessName: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
  },
  headline: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 24,
    lineHeight: 1.4,
  },
  qrCode: {
    width: 340,
    height: 340,
    marginTop: 32,
  },
  scanHint: {
    fontSize: 13,
    color: '#52525b',
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#71717a',
    textAlign: 'center',
  },
  poweredBy: {
    fontSize: 9,
    color: '#a1a1aa',
    marginTop: 8,
  },
})

export interface PlvKitInput {
  businessName: string
  logoUrl: string | null
  smartLink: string
  brandColor: string
}

// A4 counter-card PDF — the printable-and-laminate step up from the raw QR
// PNG DownloadQrButton already offers on /dashboard (that one stays; this is
// a fuller, presentation-ready document, not a replacement). Vector text +
// a high-resolution (1000px source) raster QR, which prints crisp at A4
// size — a fully vector QR isn't worth the added complexity for a single
// counter card.
export async function generatePlvKitPdf(input: PlvKitInput): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(input.smartLink, { margin: 1, width: 1000, color: { dark: '#18181b', light: '#ffffff' } })

  const doc = (
    <Document title={`Kit PLV comptoir — ${input.businessName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is not an HTML <img>; it has no alt prop. */}
          {input.logoUrl && <Image src={input.logoUrl} style={styles.logo} />}
          <Text style={[styles.businessName, { color: input.brandColor }]}>{input.businessName}</Text>
        </View>

        <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Text style={styles.headline}>
            Scannez pour débloquer votre carte de fidélité{'\n'}& vos offres exclusives ☕🥐
          </Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is not an HTML <img>; it has no alt prop. */}
          <Image src={qrDataUrl} style={styles.qrCode} />
          <Text style={styles.scanHint}>Ouvrez l’appareil photo de votre téléphone et visez le QR code</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Compatible Apple Wallet & Google Pay — 0 application à télécharger</Text>
          <Text style={styles.poweredBy}>Propulsé par Loyalty</Text>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
