import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { candidateName?: string; applicationNumber?: number }

function NewApplicationEmail({ candidateName, applicationNumber }: Props) {
  return (
    <Html lang="en-GB" dir="ltr">
      <Head />
      <Preview>You have received a new application at Alvanto.</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ padding: '32px 24px', maxWidth: '560px' }}>
          <Heading>Alvanto</Heading>
          {applicationNumber != null && <Text>Application # {applicationNumber}</Text>}
          <Text>You have received a new application{candidateName ? ` from ${candidateName}` : ''}.</Text>
          <Text>Open your panel to review the details and update the application status.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NewApplicationEmail,
  subject: (d: Record<string, any>) =>
    d?.['applicationNumber'] != null ? `New application at Alvanto #${d['applicationNumber']}` : 'New application at Alvanto',
  to: 'cdrnegociosdigitais@gmail.com',
  displayName: 'New application — Alvanto',
  previewData: { candidateName: 'Maria Silva', applicationNumber: 1 },
} satisfies TemplateEntry