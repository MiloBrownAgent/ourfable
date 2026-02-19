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
  const greeting = name ? `Welcome to OurFable, ${name}!` : "Welcome to OurFable!";

  return (
    <Html>
      <Head />
      <Preview>Your account is ready — let&apos;s make some magic!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* Header */}
            <Section style={headerSection}>
              <Text style={emojiHeader}>&#128640;&#128214;&#127775;</Text>
              <Text style={logo}>
                OurFable<span style={logoSuffix}>.ai</span>
              </Text>
            </Section>

            {/* Body */}
            <Section style={bodySection}>
              <Text style={heading}>{greeting} &#127881;</Text>
              <Text style={subtitle}>
                Your account is ready. Let&apos;s make some magic.
              </Text>

              {/* Steps */}
              <Section style={stepsBox}>
                <Section style={stepRow}>
                  <Section style={stepNumberTeal}>
                    <Text style={stepNumberText}>1</Text>
                  </Section>
                  <Section style={stepContent}>
                    <Text style={stepTitle}>Upload a photo</Text>
                    <Text style={stepDesc}>
                      One clear shot — that&apos;s all the AI needs &#128248;
                    </Text>
                  </Section>
                </Section>

                <Section style={stepRow}>
                  <Section style={stepNumberCoral}>
                    <Text style={stepNumberText}>2</Text>
                  </Section>
                  <Section style={stepContent}>
                    <Text style={stepTitle}>Pick a theme</Text>
                    <Text style={stepDesc}>
                      Space, ocean, dragons, fairy tales — go wild &#128009;
                    </Text>
                  </Section>
                </Section>

                <Section style={stepRow}>
                  <Section style={stepNumberGold}>
                    <Text style={stepNumberText}>3</Text>
                  </Section>
                  <Section style={stepContent}>
                    <Text style={stepTitle}>Get your book</Text>
                    <Text style={stepDesc}>
                      12 illustrated pages in under 3 minutes &#9889;
                    </Text>
                  </Section>
                </Section>
              </Section>

              <Section style={buttonContainer}>
                <Button style={ctaButton} href={`${appUrl}/create`}>
                  &#10024; Create Your First Book
                </Button>
              </Section>

              <Section style={tipBox}>
                <Text style={tipText}>
                  &#128161; <strong>Pro tip:</strong> A clear, well-lit photo
                  facing the camera gives the best results!
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
    "linear-gradient(135deg, #FFF0EE 0%, #E6F7F7 50%, #FFF0EE 100%)",
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

const heading = {
  fontSize: "28px",
  fontWeight: "800" as const,
  color: "#1A1A2E",
  textAlign: "center" as const,
  margin: "0 0 8px",
  lineHeight: "1.3",
};

const subtitle = {
  fontSize: "15px",
  color: "#8888A0",
  textAlign: "center" as const,
  margin: "0 0 28px",
};

const stepsBox = {
  background: "#E6F7F7",
  borderRadius: "16px",
  padding: "24px",
  margin: "0 0 24px",
};

const stepRow = {
  marginBottom: "16px",
};

const stepNumberTeal = {
  background: "#0EA5A5",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  textAlign: "center" as const,
  display: "inline-block" as const,
  verticalAlign: "top" as const,
};

const stepNumberCoral = {
  background: "#FF6B5A",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  textAlign: "center" as const,
  display: "inline-block" as const,
  verticalAlign: "top" as const,
};

const stepNumberGold = {
  background: "#F5A623",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  textAlign: "center" as const,
  display: "inline-block" as const,
  verticalAlign: "top" as const,
};

const stepNumberText = {
  color: "#ffffff",
  fontWeight: "700" as const,
  fontSize: "14px",
  lineHeight: "32px",
  margin: "0",
};

const stepContent = {
  display: "inline-block" as const,
  marginLeft: "14px",
  verticalAlign: "top" as const,
};

const stepTitle = {
  color: "#1A1A2E",
  fontWeight: "700" as const,
  fontSize: "15px",
  margin: "0",
};

const stepDesc = {
  color: "#4A4A5E",
  fontSize: "13px",
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

const tipBox = {
  background: "#FFF8F0",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center" as const,
  border: "1px dashed #F5A623",
};

const tipText = {
  fontSize: "14px",
  color: "#4A4A5E",
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
