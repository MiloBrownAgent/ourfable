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

interface ThankYouEmailProps {
  contributorName: string;
  childName: string;
  appUrl?: string;
}

export default function ThankYouEmail({
  contributorName,
  childName,
  appUrl = "https://ourfable.ai",
}: ThankYouEmailProps) {
  const firstName = contributorName.split(" ")[0];

  return (
    <Html>
      <Head />
      <Preview>Your words are safe. {childName} will treasure them.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* Header */}
            <Section style={headerSection}>
              <Text style={emojiHeader}>📬</Text>
              <Text style={logo}>
                OurFable<span style={logoSuffix}>.ai</span>
              </Text>
            </Section>

            {/* Body */}
            <Section style={bodySection}>
              <Text style={heading}>Received. ✓</Text>

              <Text style={message}>
                {firstName}, your words are in the vault.
              </Text>

              <Text style={message}>
                One day, {childName} will sit down and read what the people who loved
                them wrote when they were small. Your answer will be there.
              </Text>

              <Section style={vaultBox}>
                <Text style={vaultText}>
                  🔒 Stored privately in {childName}&apos;s family vault
                </Text>
              </Section>

              <Text style={closing}>
                Thank you for taking the time. It matters more than you know.
              </Text>
            </Section>

            {/* Footer */}
            <Hr style={dashedDivider} />
            <Section style={footerSection}>
              <Text style={footerSmall}>
                &copy; 2026{" "}
                <a href={appUrl} style={footerLink}>
                  OurFable.ai
                </a>{" "}
                &middot; Preserving family voices for the next generation
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  background: "linear-gradient(135deg, #F3E8FF 0%, #FFF0E6 50%, #E0F2FE 100%)",
  fontFamily: "'Georgia', serif",
  padding: "0",
  margin: "0",
};

const container = {
  maxWidth: "560px",
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
  padding: "32px 40px 24px",
  textAlign: "center" as const,
};

const emojiHeader = {
  fontSize: "32px",
  margin: "0 0 6px",
  lineHeight: "1",
};

const logo = {
  fontSize: "22px",
  fontWeight: "800" as const,
  color: "#ffffff",
  margin: "0",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const logoSuffix = {
  fontWeight: "400" as const,
  fontSize: "14px",
  opacity: 0.8,
};

const bodySection = {
  padding: "36px 40px 16px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "700" as const,
  color: "#4A1D96",
  textAlign: "center" as const,
  margin: "0 0 24px",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const message = {
  fontSize: "16px",
  color: "#3D3D50",
  lineHeight: "1.7",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const vaultBox = {
  background: "linear-gradient(135deg, #F3E8FF, #E0F2FE)",
  borderRadius: "12px",
  padding: "16px 24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const vaultText = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#4A1D96",
  margin: "0",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const closing = {
  fontSize: "15px",
  color: "#6B6B85",
  lineHeight: "1.6",
  margin: "0 0 8px",
  textAlign: "center" as const,
  fontStyle: "italic" as const,
};

const dashedDivider = {
  borderTop: "2px dashed #E9D5FF",
  borderBottom: "none" as const,
  margin: "0 24px",
};

const footerSection = {
  padding: "16px 40px 28px",
  textAlign: "center" as const,
};

const footerSmall = {
  fontSize: "12px",
  color: "#9090A8",
  margin: "8px 0 0",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const footerLink = {
  color: "#6D28D9",
  textDecoration: "none",
};
