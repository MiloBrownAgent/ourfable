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
          <Section style={header}>
            <Text style={logo}>OurFable.ai</Text>
            <Hr style={accentLine} />
          </Section>
          <Section style={content}>
            <Text style={heading}>Your storybook is ready!</Text>
            <Text style={paragraph}>
              <strong>&quot;{bookTitle}&quot;</strong> starring{" "}
              <strong>{characterName}</strong> has been created and is waiting
              for you.
            </Text>
            {coverImageUrl && (
              <Section style={imageContainer}>
                <Img
                  src={coverImageUrl}
                  alt={`Cover of "${bookTitle}"`}
                  width="280"
                  style={coverImage}
                />
              </Section>
            )}
            <Section style={buttonContainer}>
              <Button
                style={ctaButton}
                href={`${appUrl}/books/${bookId}`}
              >
                Read Your Book
              </Button>
            </Section>
            <Text style={tip}>
              Love it? Order a premium hardcover to keep forever.
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

const imageContainer = {
  textAlign: "center" as const,
  margin: "16px 0",
};

const coverImage = {
  borderRadius: "8px",
  border: "1px solid #eeeeee",
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
