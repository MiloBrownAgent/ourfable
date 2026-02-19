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
      <Preview>We hit a snag with your storybook — but don&apos;t worry!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>OurFable.ai</Text>
            <Hr style={accentLine} />
          </Section>
          <Section style={content}>
            <Text style={heading}>We hit a snag</Text>
            <Text style={paragraph}>
              Something went wrong while creating your storybook. We&apos;re
              sorry about that! These things happen sometimes with AI
              generation.
            </Text>
            <Text style={paragraph}>
              The good news: you can try again right now and it usually works
              on the second attempt.
            </Text>
            <Section style={buttonContainer}>
              <Button
                style={ctaButton}
                href={`${appUrl}/books/${bookId}`}
              >
                Try Again
              </Button>
            </Section>
            <Text style={tip}>
              Still having trouble? Reply to this email and we&apos;ll help you
              out.
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              &copy; 2026 OurFable.ai &middot; You received this because you
              created a book on OurFable.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f8f8f8",
  fontFamily: "Helvetica, Arial, sans-serif",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "40px 20px",
};

const header = {
  backgroundColor: "#ffffff",
  borderRadius: "8px 8px 0 0",
  padding: "32px 40px 0",
  textAlign: "center" as const,
};

const logo = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#0EA5A5",
  margin: "0 0 16px",
};

const accentLine = {
  borderColor: "#0EA5A5",
  borderWidth: "2px",
  margin: "0",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "32px 40px",
};

const heading = {
  fontSize: "22px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#444444",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const ctaButton = {
  backgroundColor: "#0EA5A5",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600" as const,
  padding: "14px 32px",
  borderRadius: "8px",
  textDecoration: "none",
};

const tip = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#777777",
  fontStyle: "italic" as const,
  textAlign: "center" as const,
  margin: "0",
};

const footer = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 8px 8px",
  padding: "0 40px 32px",
  borderTop: "1px solid #eeeeee",
};

const footerText = {
  fontSize: "13px",
  color: "#999999",
  textAlign: "center" as const,
  margin: "16px 0 0",
};
