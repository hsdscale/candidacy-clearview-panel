import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { candidateName?: string; applicationNumber?: number; link?: string }

function WrongDocumentsEmail({ candidateName, applicationNumber, link }: Props) {
  return (
    <Html lang="pt-PT" dir="ltr">
      <Head />
      <Preview>Precisamos que volte a enviar os seus documentos.</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#1a2340' }}>
        <Container style={{ padding: '32px 24px', maxWidth: '560px' }}>
          <Heading style={{ color: '#1a2340' }}>Alvanto</Heading>
          <Text>Olá{candidateName ? ` ${candidateName}` : ''},</Text>
          <Text>
            Analisámos a sua candidatura{applicationNumber != null ? ` n.º ${applicationNumber}` : ''} e verificámos que os
            documentos enviados não estão corretos ou não estão legíveis.
          </Text>
          <Text>Para continuarmos o processo, volte a enviar o Currículo (CV), a carta de apresentação ou certificado e o comprovativo de morada no link abaixo. Não precisa de preencher o questionário outra vez.</Text>
          {link && (
            <Button href={link} style={{ backgroundColor: '#1a2340', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
              Reenviar documentos
            </Button>
          )}
          <Text style={{ marginTop: '24px' }}>Obrigado,<br />Equipa Alvanto</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WrongDocumentsEmail,
  subject: 'Alvanto: reenvie os seus documentos',
  displayName: 'Documentos errados — Alvanto',
  previewData: { candidateName: 'Maria Silva', applicationNumber: 1, link: 'https://amasom.store/reenviar/exemplo' },
} satisfies TemplateEntry
