import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { candidateName?: string }

function NewApplicationEmail({ candidateName }: Props) {
  return (
    <Html lang="pt-PT" dir="ltr">
      <Head />
      <Preview>Recebeu uma nova candidatura na Alvanto.</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ padding: '32px 24px', maxWidth: '560px' }}>
          <Heading>Alvanto</Heading>
          <Text>Recebeu uma nova candidatura{candidateName ? ` de ${candidateName}` : ''}.</Text>
          <Text>Aceda ao seu painel para consultar os dados e organizar a candidatura com as suas etiquetas.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NewApplicationEmail,
  subject: 'Novo cadastro no Alvanto',
  to: 'cdrnegociosdigitais@gmail.com',
  displayName: 'Nova candidatura — Alvanto',
  previewData: { candidateName: 'Maria Silva' },
} satisfies TemplateEntry