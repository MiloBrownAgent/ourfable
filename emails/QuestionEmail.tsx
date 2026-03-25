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

interface QuestionEmailProps {
  contributorName: string;
  childName: string;
  questionText: string;
  respondUrl: string;
  month: string; // e.g. "March 2026"
  appUrl?: string;
}

export default function QuestionEmail({
  contributorName,
  childName,
  questionText,
  respondUrl,
  month,
  appUrl = "https://ourfable.ai",
}: QuestionEmailProps) {
  const firstName = contributorName.split(" ")[0];

  return (
    <Html>
      <Head />
      <Preview>
        A question for {childName}&apos;s vault — your words will last a lifetime.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* Header */}
            <Section style={headerSection}>
              <Text style={logo}>
                OurFable<span style={logoSuffix}>.ai</span>
              </Text>
              <Text style={headerTagline}>A vault of voices for {childName}</Text>
            </Section>

            {/* Body */}
            <Section style={bodySection}>
              <Text style={greeting}>Hi {firstName},</Text>

              <Text style={intro}>
                Someone who loves {childName} set this up — because they believe your
                words are worth saving.
              </Text>

              <Text style={intro}>
                Each month, you&apos;ll get one question. Your answer goes into a private
                vault. {childName} will read it one day, when they&apos;re old enough to
                understand who loved them before they knew to ask.
              </Text>

              {/* The Question */}
              <Section style={questionBox}>
                <Text style={questionLabel}>{month} · Your question</Text>
                <Text style={questionText_}>&ldquo;{questionText}&rdquo;</Text>
              </Section>

              <Text style={callToAction}>
                Take a few minutes. Write what comes naturally. There&apos;s no wrong
                answer — only the one you&apos;d want {childName} to have.
              </Text>

              <Section style={buttonContainer}>
                <Button style={ctaButton} href={respondUrl}>
                  ✍️ Answer This Question
                </Button>
              </Section>

              <Section style={tipBox}>
                <Text style={tipText}>
                  💡 <strong>No login needed.</strong> Just click the button above — it
                  takes you straight to a private page for your answer.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Hr style={dashedDivider} />
            <Section style={footerSection}>
              <Text style={footerText}>
                This was set up by someone who loves {childName}. Your response is
                private — only they can read it.
              </Text>
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
  padding: "36px 40px 28px",
  textAlign: "center" as const,
};

const logo = {
  fontSize: "26px",
  fontWeight: "800" as const,
  color: "#ffffff",
  margin: "0 0 6px",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const logoSuffix = {
  fontWeight: "400" as const,
  fontSize: "15px",
  opacity: 0.8,
};

const headerTagline = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.8)",
  margin: "0",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  letterSpacing: "0.5px",
};

const bodySection = {
  padding: "36px 40px 16px",
};

const greeting = {
  fontSize: "20px",
  fontWeight: "700" as const,
  color: "#4A1D96",
  margin: "0 0 16px",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const intro = {
  fontSize: "15px",
  color: "#3D3D50",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const questionBox = {
  background: "linear-gradient(135deg, #F3E8FF, #FFF0E6)",
  borderRadius: "16px",
  padding: "28px 32px",
  margin: "24px 0",
  borderLeft: "4px solid #6D28D9",
};

const questionLabel = {
  fontSize: "11px",
  fontWeight: "700" as const,
  color: "#6D28D9",
  textTransform: "uppercase" as const,
  letterSpacing: "1.5px",
  margin: "0 0 12px",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const questionText_ = {
  fontSize: "20px",
  fontWeight: "600" as const,
  color: "#2D1B69",
  lineHeight: "1.5",
  margin: "0",
  fontStyle: "italic" as const,
};

const callToAction = {
  fontSize: "15px",
  color: "#3D3D50",
  lineHeight: "1.7",
  margin: "0 0 24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 20px",
};

const ctaButton = {
  background: "linear-gradient(135deg, #4A1D96 0%, #EC4899 100%)",
  color: "#ffffff",
  fontSize: "17px",
  fontWeight: "700" as const,
  padding: "16px 40px",
  borderRadius: "50px",
  textDecoration: "none",
  display: "inline-block" as const,
  boxShadow: "0 4px 15px rgba(74,29,150,0.35)",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const tipBox = {
  background: "#F8F4FF",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center" as const,
  border: "1px dashed #C4B5FD",
};

const tipText = {
  fontSize: "13px",
  color: "#4A4A5E",
  margin: "0",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
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
  fontSize: "13px",
  color: "#6B6B85",
  margin: "0 0 8px",
  lineHeight: "1.6",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
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
