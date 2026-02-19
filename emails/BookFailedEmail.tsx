import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components";

interface BookFailedEmailProps {
  bookId: string;
  appUrl?: string;
}

export default function BookFailedEmail({
  bookId = "",
  appUrl = "https://ourfable.ai",
}: BookFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        We hit a snag with your storybook — but don&apos;t worry!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* Header */}
            <Section style={headerSection}>
              <Text style={emojiHeader}>&#129668;</Text>
              <Text style={logo}>
                OurFable<span style={logoSuffix}>.ai</span>
              </Text>
            </Section>

            {/* Body */}
            <Section style={bodySection}>
              <Text style={heading}>Oops! A little hiccup &#128584;</Text>

              <Text style={paragraph}>
                Our magic wand got a little confused while creating your
                storybook. It happens to the best wizards!
              </Text>

              <Section style={reassureBox}>
                <Text style={reassureText}>
                  <strong>Good news:</strong> A second try almost always does the
                  trick! &#10024;
                </Text>
              </Section>

              <Section style={buttonContainer}>
                <Button
                  style={ctaButton}
                  href={`${appUrl}/books/${bookId}`}
                >
                  &#128260; Try Again
                </Button>
              </Section>

              <Text style={supportText}>
                Still stuck? Just reply to this email — we&apos;ll sort it out!
                &#128140;
              </Text>
            </Section>

            {/* Footer */}
            <Hr style={dashedDivider} />
            <Section style={footerSection}>
              <Text style={footerText}>
                &copy; 2026 OurFable.ai &middot; Made with &#10084;&#65039; for
                parents and kids everywhere
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  background:
    "linear-gradient(135deg, #E6F7F7 0%, #FFF0EE 50%, #E6F7F7 100%)",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  padding: "0",
  margin: "0",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "40px 20px",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  overflow: "hidden" as const,
  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
};

const headerSection = {
  background: "linear-gradient(135deg, #0EA5A5 0%, #0C8C8C 100%)",
  padding: "40px 40px 32px",
  textAlign: "center" as const,
};

const emojiHeader = {
  fontSize: "40px",
  margin: "0 0 8px",
  lineHeight: "1",
};

const logo = {
  fontSize: "28px",
  fontWeight: "800" as const,
  color: "#ffffff",
  margin: "0",
};

const logoSuffix = {
  fontWeight: "400" as const,
  fontSize: "16px",
  opacity: 0.8,
};

const bodySection = {
  padding: "40px 40px 16px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "800" as const,
  color: "#1A1A2E",
  textAlign: "center" as const,
  margin: "0 0 16px",
  lineHeight: "1.3",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.7",
  color: "#4A4A5E",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const reassureBox = {
  background: "#E6F7F7",
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const reassureText = {
  fontSize: "15px",
  color: "#0EA5A5",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const ctaButton = {
  background: "linear-gradient(135deg, #FF6B5A 0%, #E85A4A 100%)",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700" as const,
  padding: "16px 40px",
  borderRadius: "50px",
  textDecoration: "none",
  display: "inline-block" as const,
  boxShadow: "0 4px 15px rgba(255,107,90,0.3)",
};

const supportText = {
  fontSize: "14px",
  color: "#8888A0",
  textAlign: "center" as const,
  margin: "0",
};

const dashedDivider = {
  borderTop: "2px dashed #E8E8EE",
  borderBottom: "none" as const,
  margin: "0 24px",
};

const footerSection = {
  padding: "20px 40px 32px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#8888A0",
  margin: "16px 0 0",
};
