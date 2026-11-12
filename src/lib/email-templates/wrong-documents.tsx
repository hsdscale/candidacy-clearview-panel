import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { candidateName?: string; applicationNumber?: number; link?: string; message?: string }

function WrongDocumentsEmail({ candidateName, applicationNumber, link, message }: Props) {
  return (
    <Html lang="en-GB" dir="ltr">
      <Head />
      <Preview>Please resubmit your documents.</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#1a2340' }}>
        <Container style={{ padding: '32px 24px', maxWidth: '560px' }}>
          <Heading style={{ color: '#1a2340' }}>Alvanto</Heading>
          <Text>Hello{candidateName ? ` ${candidateName}` : ''},</Text>
          {message ? message.split(/\n\s*\n/).map((p, i) => <Text key={i} style={{ whiteSpace: 'pre-line' }}>{p}</Text>) : (<>
          <Text>
            We have reviewed your application{applicationNumber != null ? ` #${applicationNumber}` : ''} and found that the
            documents submitted are incorrect or illegible.
          </Text>
          <Text>Para continuarmos o processo, volte a enviar o Identity document — front, a carta de apresentação ou certificado e o comprovativo de morada no link abaixo. Não precisa de preencher o questionário outra vez.</Text>
          </>)}
          {link && (
            <Button href={link} style={{ backgroundColor: '#1a2340', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
              Resubmit documents
            </Button>
          )}
          <Text style={{ marginTop: '24px' }}>Thank you,<br />The Alvanto team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WrongDocumentsEmail,
  subject: 'Alvanto: please resubmit your documents',
  displayName: 'Incorrect documents — Alvanto',
  previewData: { candidateName: 'Maria Silva', applicationNumber: 1, link: 'https://amasom.store/reenviar/exemplo' },
} satisfies TemplateEntry
