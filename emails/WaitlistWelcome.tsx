import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from "@react-email/components";

export default function WaitlistWelcome() {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re on the OurFable.ai early access list!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>OurFable.ai</Text>
            <Hr style={accentLine} />
          </Section>
          <Section style={content}>
            <Text style={heading}>You&apos;re on the list!</Text>
            <Text style={paragraph}>
              Thanks for signing up for early access to OurFable.ai! We&apos;re
              building something special — personalized storybooks where your
              child is the hero, brought to life with beautiful AI illustrations.
            </Text>
            <Text style={paragraph}>
              Upload one photo, pick a theme, and in minutes you&apos;ll have a
              gorgeous 12-page storybook. Digital or premium hardcover — it&apos;s
              magic.
            </Text>
            <Text style={paragraph}>
              We&apos;ll let you know as soon as you can create your first book.
              It&apos;s going to be worth the wait.
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              &copy; 2026 OurFable.ai &middot; You received this because you
              joined our waitlist.
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
