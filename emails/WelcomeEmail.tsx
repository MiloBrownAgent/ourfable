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

interface WelcomeEmailProps {
  name?: string;
  appUrl?: string;
}

export default function WelcomeEmail({
  name,
  appUrl = "https://ourfable.ai",
}: WelcomeEmailProps) {
  const greeting = name ? `Welcome, ${name}!` : "Welcome to OurFable!";

  return (
    <Html>
      <Head />
      <Preview>Your account is ready — let&apos;s make some magic!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>OurFable.ai</Text>
            <Hr style={accentLine} />
          </Section>
          <Section style={content}>
            <Text style={heading}>{greeting}</Text>
            <Text style={paragraph}>
              Your OurFable account is all set. Here&apos;s what you can do:
            </Text>
            <Text style={listItem}>
              <strong>Upload a photo</strong> — one clear shot of your child is
              all it takes
            </Text>
            <Text style={listItem}>
              <strong>Pick a theme</strong> — space adventures, fairy tales, dinosaur
              quests, and more
            </Text>
            <Text style={listItem}>
              <strong>Get a storybook</strong> — 12 beautifully illustrated pages
              in minutes
            </Text>
            <Section style={buttonContainer}>
              <Button style={ctaButton} href={`${appUrl}/create`}>
                Create Your First Book
              </Button>
            </Section>
            <Text style={tip}>
              Tip: A clear, well-lit photo facing the camera gives the best
              results!
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              &copy; 2026 OurFable.ai &middot; You received this because you
              created an account.
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

const listItem = {
  fontSize: "15px",
  lineHeight: "1.5",
  color: "#444444",
  margin: "0 0 8px",
  paddingLeft: "8px",
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
