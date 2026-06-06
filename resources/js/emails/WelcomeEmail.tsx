import * as React from 'react';
import { Html, Head, Preview, Body, Container, Heading, Text, Button } from 'react-email';

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ name }) => (
  <Html>
    <Head />
    <Preview>Welcome to our CMS, {name}!</Preview>
    <Body style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Heading style={{ color: '#111827', fontSize: '24px', marginBottom: '20px' }}>Welcome, {name}!</Heading>
        <Text style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.5' }}>
          We're excited to have you on board. Your account has been created successfully and you can now start using our CMS platform.
        </Text>
        <Button
          href="{{{appUrl}}}/login"
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-block',
            marginTop: '30px',
          }}
        >
          Go to Dashboard
        </Button>
        <Text style={{ color: '#9ca3af', fontSize: '14px', marginTop: '40px' }}>
          If you did not sign up for this account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;
