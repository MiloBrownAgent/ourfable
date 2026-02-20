import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Preview,
} from "@react-email/components";

interface BookReadyEmailProps {
  bookTitle: string;
  characterName: string;
  bookId: string;
  coverImageUrl?: string;
  appUrl?: string;
}

export default function BookReadyEmail({
  bookTitle = "Your Storybook",
  characterName = "your little one",
  bookId = "",
  coverImageUrl,
  appUrl = "https://ourfable.ai",
}: BookReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        &quot;{bookTitle}&quot; starring {characterName} is ready to read!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* Header */}
            <Section style={headerSection}>
              <Text style={emojiHeader}>&#127881;&#10024;&#127881;</Text>
              <Text style={logo}>
                OurFable<span style={logoSuffix}>.ai</span>
              </Text>
            </Section>

            {/* Body */}
            <Section style={bodySection}>
              <Section
                style={{
                  textAlign: "center" as const,
                  marginBottom: "16px",
                }}
              >
                <Text style={badge}>&#128214; STORY COMPLETE</Text>
              </Section>

              <Text style={heading}>Your storybook is ready! &#127775;</Text>
              <Text style={paragraph}>
                <strong style={{ color: "#FF6B35" }}>
                  &quot;{bookTitle}&quot;
                </strong>{" "}
                starring{" "}
                <strong style={{ color: "#4A1D96" }}>{characterName}</strong> is
                waiting for you &#10024;
              </Text>

              {/* Cover image */}
              {coverImageUrl && (
                <Section style={imageContainer}>
                  <Img
                    src={coverImageUrl}
                    alt={`Cover of "${bookTitle}"`}
                    width="260"
                    style={coverImage}
                  />
                </Section>
              )}

              <Section style={buttonContainer}>
                <Button
                  style={ctaButton}
                  href={`${appUrl}/books/${bookId}`}
                >
                  &#128214; Read Your Book
                </Button>
              </Section>

              <Section style={upsellBox}>
                <Text style={upsellEmoji}>&#127873;</Text>
                <Text style={upsellText}>
                  <strong>Love it?</strong> Turn it into a premium hardcover
                  book they&apos;ll treasure forever!
                </Text>
              </Section>
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
    "linear-gradient(135deg, #F3E8FF 0%, #FFF0E6 50%, #E0F2FE 100%)",
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
  boxShadow: "0 8px 30px rgba(74,29,150,0.12)",
};

const headerSection = {
  background: "linear-gradient(135deg, #4A1D96 0%, #6D28D9 50%, #EC4899 100%)",
  padding: "40px 40px 32px",
  textAlign: "center" as const,
};

const emojiHeader = {
  fontSize: "48px",
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

const badge = {
  display: "inline-block" as const,
  background: "linear-gradient(135deg, #F3E8FF, #FCE7F3)",
  color: "#4A1D96",
  fontSize: "13px",
  fontWeight: "700" as const,
  padding: "6px 16px",
  borderRadius: "20px",
  letterSpacing: "0.5px",
  margin: "0",
};

const heading = {
  fontSize: "28px",
  fontWeight: "800" as const,
  color: "#4A1D96",
  textAlign: "center" as const,
  margin: "0 0 8px",
  lineHeight: "1.3",
};

const paragraph = {
  fontSize: "16px",
  color: "#4A4A5E",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const imageContainer = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const coverImage = {
  borderRadius: "16px",
  border: "3px solid #E9D5FF",
  boxShadow: "0 8px 25px rgba(74,29,150,0.15)",
  display: "block" as const,
  margin: "0 auto",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const ctaButton = {
  background: "linear-gradient(135deg, #FF6B35 0%, #EC4899 100%)",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700" as const,
  padding: "16px 40px",
  borderRadius: "50px",
  textDecoration: "none",
  display: "inline-block" as const,
  boxShadow: "0 4px 15px rgba(255,107,53,0.35)",
};

const upsellBox = {
  background: "linear-gradient(135deg, #FFF0E6, #FCE7F3)",
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center" as const,
  border: "2px solid #FDBA74",
};

const upsellEmoji = {
  fontSize: "24px",
  margin: "0 0 8px",
};

const upsellText = {
  fontSize: "15px",
  color: "#1A1A2E",
  margin: "0",
};

const dashedDivider = {
  borderTop: "2px dashed #E9D5FF",
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
