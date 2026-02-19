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
          <Section style={card}>
            {/* Header */}
            <Section style={headerSection}>
              <Text style={emojiHeader}>&#10024;&#128218;&#10024;</Text>
              <Text style={logo}>
                OurFable<span style={logoSuffix}>.ai</span>
              </Text>
            </Section>

            {/* Body */}
            <Section style={bodySection}>
              <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
                <Text style={badge}>&#127881; YOU&apos;RE IN!</Text>
              </Section>

              <Text style={heading}>You&apos;re on the early access list!</Text>

              <Text style={paragraph}>
                We&apos;re building something magical — personalized storybooks
                where{" "}
                <strong style={{ color: "#0EA5A5" }}>
                  your child becomes the hero
                </strong>{" "}
                of their very own adventure. &#10024;
              </Text>

              {/* Feature pills */}
              <Section style={pillContainer}>
                <Text style={pillTeal}>&#128248; One photo</Text>
                <Text style={pillCoral}>&#127912; AI illustrations</Text>
                <Text style={pillTeal}>&#9889; Under 3 min</Text>
              </Section>

              <Text style={paragraph}>
                We&apos;ll email you the moment you can create your first book.{" "}
                <strong>It&apos;s going to be worth the wait.</strong> &#129668;
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
  background: "linear-gradient(135deg, #E6F7F7 0%, #FFF0EE 50%, #E6F7F7 100%)",
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
  fontSize: "32px",
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
  background: "#FFF0EE",
  color: "#FF6B5A",
  fontSize: "13px",
  fontWeight: "700" as const,
  padding: "6px 16px",
  borderRadius: "20px",
  letterSpacing: "0.5px",
  margin: "0",
};

const heading = {
  fontSize: "26px",
  fontWeight: "800" as const,
  color: "#1A1A2E",
  textAlign: "center" as const,
  margin: "0 0 20px",
  lineHeight: "1.3",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.7",
  color: "#4A4A5E",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const pillContainer = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const pillTeal = {
  display: "inline-block" as const,
  background: "#E6F7F7",
  color: "#0EA5A5",
  fontSize: "13px",
  fontWeight: "600" as const,
  padding: "8px 14px",
  borderRadius: "20px",
  margin: "4px",
};

const pillCoral = {
  display: "inline-block" as const,
  background: "#FFF0EE",
  color: "#FF6B5A",
  fontSize: "13px",
  fontWeight: "600" as const,
  padding: "8px 14px",
  borderRadius: "20px",
  margin: "4px",
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
