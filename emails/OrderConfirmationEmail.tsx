import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface OrderConfirmationEmailProps {
  customerName?: string;
  bookTitle: string;
  characterName: string;
  format: "digital" | "hardcover";
  amountDollars: string;
  orderId: string;
  bookId: string;
  appUrl?: string;
}

export default function OrderConfirmationEmail({
  customerName,
  bookTitle = "Your Storybook",
  characterName = "your little one",
  format = "digital",
  amountDollars = "$14.99",
  orderId = "",
  bookId = "",
  appUrl = "https://ourfable.ai",
}: OrderConfirmationEmailProps) {
  const isDigital = format === "digital";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* Header */}
            <Section style={headerSection}>
              <Text style={emojiHeader}>🎉✨</Text>
              <Text style={logo}>
                OurFable<span style={logoSuffix}>.ai</span>
              </Text>
            </Section>

            {/* Body */}
            <Section style={bodySection}>
              <Section style={{ textAlign: "center" as const, marginBottom: "16px" }}>
                <Text style={badge}>✅ ORDER CONFIRMED</Text>
              </Section>

              <Text style={heading}>
                {customerName ? `Thanks, ${customerName}! ` : ""}Your order is confirmed! 🎊
              </Text>

              <Text style={paragraph}>
                <strong style={{ color: "#FF6B35" }}>&quot;{bookTitle}&quot;</strong>{" "}
                starring{" "}
                <strong style={{ color: "#4A1D96" }}>{characterName}</strong>{" "}
                is on its way to becoming a{" "}
                {isDigital ? "digital storybook" : "beautiful hardcover book"}{" "}
                they&apos;ll treasure forever! ✨
              </Text>

              {/* Order details */}
              <Section style={orderBox}>
                <Text style={orderBoxTitle}>📋 Order Details</Text>
                <Section style={orderRow}>
                  <Text style={orderLabel}>Book</Text>
                  <Text style={orderValue}>&quot;{bookTitle}&quot;</Text>
                </Section>
                <Section style={orderRow}>
                  <Text style={orderLabel}>Format</Text>
                  <Text style={orderValue}>
                    {isDigital ? "📱 Digital Edition" : "📖 Hardcover Edition"}
                  </Text>
                </Section>
                <Section style={orderRow}>
                  <Text style={orderLabel}>Amount</Text>
                  <Text style={orderValue}>{amountDollars}</Text>
                </Section>
                <Section style={{ ...orderRow, borderBottom: "none" }}>
                  <Text style={orderLabel}>Order ID</Text>
                  <Text style={{ ...orderValue, fontSize: "11px", color: "#8888A0" }}>
                    {orderId}
                  </Text>
                </Section>
              </Section>

              {/* What happens next */}
              <Text style={subheading}>What happens next?</Text>
              {isDigital ? (
                <>
                  <Text style={stepText}>
                    📱 <strong>Your book is ready now.</strong> Head to your dashboard to read it anytime, on any device.
                  </Text>
                  <Text style={stepText}>
                    📩 <strong>Share it with family.</strong> Copy the link and send it to grandparents, aunts, uncles — anyone who&apos;ll love watching {characterName}&apos;s story come to life.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={stepText}>
                    🖨️ <strong>We&apos;re preparing your print file.</strong> Once ready, your book ships within 5-7 business days.
                  </Text>
                  <Text style={stepText}>
                    📦 <strong>Tracking info</strong> will be emailed to you as soon as your book ships.
                  </Text>
                </>
              )}

              <Section style={buttonContainer}>
                <Button
                  style={ctaButton}
                  href={`${appUrl}/books/${bookId}`}
                >
                  📖 {isDigital ? "Read Your Book Now" : "View Your Book"}
                </Button>
              </Section>
            </Section>

            {/* Footer */}
            <Hr style={dashedDivider} />
            <Section style={footerSection}>
              <Text style={footerText}>
                Questions? Reply to this email — we&apos;re happy to help!
              </Text>
              <Text style={footerText}>
                © 2026 OurFable.ai · Made with ❤️ for parents and kids everywhere
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const main = {
  background: "linear-gradient(135deg, #F3E8FF 0%, #FFF0E6 50%, #E0F2FE 100%)",
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
  background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
  color: "#065F46",
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
  color: "#4A1D96",
  textAlign: "center" as const,
  margin: "0 0 12px",
  lineHeight: "1.3",
};

const paragraph = {
  fontSize: "16px",
  color: "#4A4A5E",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const orderBox = {
  background: "#F9FAFB",
  borderRadius: "16px",
  padding: "20px 24px",
  border: "1.5px solid #E5E7EB",
  marginBottom: "28px",
};

const orderBoxTitle = {
  fontSize: "14px",
  fontWeight: "700" as const,
  color: "#374151",
  margin: "0 0 12px",
  letterSpacing: "0.3px",
};

const orderRow = {
  display: "flex" as const,
  justifyContent: "space-between" as const,
  borderBottom: "1px solid #E5E7EB",
  paddingBottom: "10px",
  marginBottom: "10px",
};

const orderLabel = {
  fontSize: "13px",
  color: "#6B7280",
  margin: "0",
};

const orderValue = {
  fontSize: "13px",
  fontWeight: "600" as const,
  color: "#111827",
  margin: "0",
};

const subheading = {
  fontSize: "18px",
  fontWeight: "700" as const,
  color: "#4A1D96",
  margin: "0 0 12px",
};

const stepText = {
  fontSize: "15px",
  color: "#4A4A5E",
  margin: "0 0 12px",
  lineHeight: "1.5",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0 8px",
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
  margin: "4px 0 0",
};
