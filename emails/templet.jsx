import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Column,
  Row,
} from "@react-email/components";

// Dummy data for preview
const PREVIEW_DATA = {
  monthlyReport: {
    userName: "John Doe",
    type: "monthly-report",
    data: {
      month: "December",
      year: "2024",
      stats: {
        totalIncome: 5000,
        totalExpenses: 3500,
        savings: 1500,
        savingsRate: 30,
        byCategory: {
          "🏠 Housing": 1500,
          "🛒 Groceries": 600,
          "🚗 Transportation": 400,
          "🎬 Entertainment": 300,
          "💡 Utilities": 700,
        },
      },
      insights: [
        "Your housing expenses are 43% of your total spending - consider reviewing your housing costs.",
        "Great job keeping entertainment expenses under control this month!",
        "Setting up automatic savings could help you save 20% more of your income.",
      ],
    },
  },
  budgetAlert: {
    userName: "John Doe",
    type: "budget-alert",
    data: {
      percentageUsed: 85,
      budgetAmount: 4000,
      totalExpenses: 3400,
      remaining: 600,
      category: "Overall Budget",
      daysLeft: 5,
    },
  },
};

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  if (type === "monthly-report") {
    return (
      <Html>
        <Head />
        <Preview>📊 Your {data?.month} Financial Report is Ready!</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            {/* Header */}
            <Section style={styles.header}>
              <Text style={styles.brand}>💰 Welth</Text>
              <Heading style={styles.title}>
                Your {data?.month} {data?.year} Financial Report
              </Heading>
            </Section>

            {/* Greeting */}
            <Section style={styles.section}>
              <Text style={styles.greeting}>Hello {userName || "there"},</Text>
              <Text style={styles.subtitle}>
                Here's your financial summary for {data?.month}. You're doing
                great!
              </Text>
            </Section>

            {/* Key Metrics */}
            <Section style={styles.metricsSection}>
              <Row>
                <Column style={styles.metricColumn}>
                  <div style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Income</Text>
                    <Text style={styles.metricValue}>
                      ₹{data?.stats?.totalIncome?.toLocaleString()}
                    </Text>
                  </div>
                </Column>
                <Column style={styles.metricColumn}>
                  <div style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Expenses</Text>
                    <Text style={styles.metricValue}>
                      ₹{data?.stats?.totalExpenses?.toLocaleString()}
                    </Text>
                  </div>
                </Column>
                <Column style={styles.metricColumn}>
                  <div style={{ ...styles.metricCard, ...styles.savingsCard }}>
                    <Text style={styles.metricLabel}>Savings</Text>
                    <Text style={styles.metricValue}>
                      ₹{data?.stats?.savings?.toLocaleString()}
                    </Text>
                    <Text style={styles.savingsRate}>
                      {data?.stats?.savingsRate.toFixed(2)}% of income
                    </Text>
                  </div>
                </Column>
              </Row>
            </Section>

            {/* Spending by Category */}
            {data?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.sectionTitle}>
                  📈 Spending by Category
                </Heading>
                <div style={styles.categoryList}>
                  {Object.entries(data.stats.byCategory).map(
                    ([category, amount]) => {
                      const percentage = (
                        (amount / data.stats.totalExpenses) *
                        100
                      ).toFixed(1);
                      return (
                        <div key={category} style={styles.categoryItem}>
                          <div style={styles.categoryHeader}>
                            <Text style={styles.categoryName}>{category}</Text>
                            <Text style={styles.categoryAmount}>₹{amount.toFixed(1)}</Text>
                          </div>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${percentage}%`,
                                backgroundColor:
                                  percentage > 30
                                    ? "#ef4444"
                                    : percentage > 20
                                      ? "#f59e0b"
                                      : "#10b981",
                              }}
                            />
                          </div>
                          <Text style={styles.percentage}>{percentage}%</Text>
                        </div>
                      );
                    }
                  )}
                </div>
              </Section>
            )}

            {/* AI Insights */}
            {data?.insights && (
              <Section style={styles.insightsSection}>
                <Heading style={styles.sectionTitle}>💡 Welth Insights</Heading>
                <div style={styles.insightsList}>
                  {data.insights.map((insight, index) => (
                    <div key={index} style={styles.insightItem}>
                      <div style={styles.insightIcon}>✨</div>
                      <Text style={styles.insightText}>{insight}</Text>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* CTA */}
            <Section style={styles.ctaSection}>
              <Button
                href="https://wealthwise-by-naren.vercel.app/"
                style={styles.ctaButton}
              >
                View Detailed Report
              </Button>
            </Section>

            {/* Footer */}
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                Thank you for using Welth. Keep tracking your finances for
                better financial health!
              </Text>
              <Text style={styles.footerNote}>
                This is an automated email. Please do not reply to this message.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    const getAlertColor = () => {
      if (data?.percentageUsed >= 90) return "#ef4444";
      if (data?.percentageUsed >= 75) return "#f59e0b";
      return "#10b981";
    };

    const getAlertIcon = () => {
      if (data?.percentageUsed >= 90) return "🚨";
      if (data?.percentageUsed >= 75) return "⚠️";
      return "💰";
    };

    return (
      <Html>
        <Head />
        <Preview>
          {getAlertIcon()} Budget Alert: {data?.percentageUsed}% Used
        </Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            {/* Header */}
            <Section style={styles.header}>
              <Text style={styles.brand}>💰 Welth</Text>
              <Heading style={styles.title}>
                {getAlertIcon()} Budget Alert
              </Heading>
            </Section>

            {/* Alert Message */}
            <Section style={styles.section}>
              <Text style={styles.greeting}>Hello {userName},</Text>
              <div
                style={{
                  ...styles.alertBanner,
                  backgroundColor: getAlertColor() + "15",
                  borderColor: getAlertColor() + "30",
                }}
              >
                <Text
                  style={{
                    ...styles.alertText,
                    color: getAlertColor(),
                  }}
                >
                  You've used{" "}
                  <strong>{data?.percentageUsed.toFixed(2)}%</strong> of your{" "}
                  {data?.category} budget
                  {data?.daysLeft &&
                    ` with ${data.daysLeft} days left in the month`}
                  .
                </Text>
              </div>
            </Section>

            {/* Budget Stats */}
            <Section style={styles.metricsSection}>
              <Row>
                <Column style={styles.metricColumn}>
                  <div style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Budget</Text>
                    <Text style={styles.metricValue}>
                      ₹{data?.budgetAmount?.toLocaleString()}
                    </Text>
                  </div>
                </Column>
                <Column style={styles.metricColumn}>
                  <div style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Spent</Text>
                    <Text style={styles.metricValue}>
                      ₹{data?.totalExpenses?.toLocaleString()}
                    </Text>
                  </div>
                </Column>
                <Column style={styles.metricColumn}>
                  <div
                    style={{
                      ...styles.metricCard,
                      ...(data?.remaining < 0
                        ? styles.negativeCard
                        : styles.positiveCard),
                    }}
                  >
                    <Text style={styles.metricLabel}>Remaining</Text>
                    <Text style={styles.metricValue}>
                      ₹{Math.abs(data?.remaining)?.toLocaleString()}
                      {data?.remaining < 0 && " over"}
                    </Text>
                  </div>
                </Column>
              </Row>
            </Section>

            {/* Progress Bar */}
            <Section style={styles.section}>
              <div style={styles.progressContainer}>
                <div style={styles.progressLabels}>
                  <Text style={styles.progressText}>₹0</Text>
                  <Text style={styles.progressText}>₹{data?.budgetAmount}</Text>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${Math.min(data?.percentageUsed, 100)}%`,
                      backgroundColor: getAlertColor(),
                    }}
                  />
                </div>
                <Text style={styles.progressPercentage}>
                  {data?.percentageUsed.toFixed(2)}% used
                </Text>
              </div>
            </Section>

            {/* Tips */}
            <Section style={styles.insightsSection}>
              <Heading style={styles.sectionTitle}>💡 Quick Tips</Heading>
              <div style={styles.insightsList}>
                <div style={styles.insightItem}>
                  <div style={styles.insightIcon}>📝</div>
                  <Text style={styles.insightText}>
                    Review your recent transactions in the{" "}
                    {data?.topSpendingCategory} category
                  </Text>
                </div>
                <div style={styles.insightItem}>
                  <div style={styles.insightIcon}>🎯</div>
                  <Text style={styles.insightText}>
                    Consider adjusting your budget for next month based on this
                    month's spending
                  </Text>
                </div>
              </div>
            </Section>

            {/* CTA */}
            <Section style={styles.ctaSection}>
              <Button
                href="https://wealthwise-by-naren.vercel.app/"
                style={styles.ctaButton}
              >
                Review Budget
              </Button>
            </Section>

            {/* Footer */}
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                You're receiving this alert because you have budget tracking
                enabled.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }
}

const styles = {
  body: {
    backgroundColor: "#f8fafc",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "0",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
    maxWidth: "600px",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px 32px",
    textAlign: "center",
    color: "#ffffff",
  },
  brand: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "16px",
    opacity: 0.9,
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0",
    color: "#ffffff",
  },
  section: {
    padding: "32px",
  },
  greeting: {
    fontSize: "18px",
    color: "#1f2937",
    margin: "0 0 8px 0",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0",
    lineHeight: "1.5",
  },
  metricsSection: {
    padding: "24px 32px",
    backgroundColor: "#f8fafc",
  },
  metricColumn: {
    padding: "0 8px",
  },
  metricCard: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  savingsCard: {
    backgroundColor: "#10b981",
    color: "#ffffff",
  },
  metricLabel: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 8px 0",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  metricValue: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
    color: "#1f2937",
  },
  savingsRate: {
    fontSize: "12px",
    color: "#ffffff",
    opacity: 0.9,
    margin: "4px 0 0 0",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 20px 0",
  },
  categoryList: {
    spaceY: "12px",
  },
  categoryItem: {
    marginBottom: "16px",
  },
  categoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  categoryName: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: "500",
    margin: "0",
  },
  categoryAmount: {
    fontSize: "14px",
    color: "#1f2937",
    fontWeight: "600",
    margin: "0",
  },
  progressContainer: {
    marginTop: "16px",
  },
  progressBar: {
    backgroundColor: "#e5e7eb",
    borderRadius: "10px",
    height: "8px",
    overflow: "hidden",
    margin: "8px 0",
  },
  progressFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 0.3s ease",
  },
  progressLabels: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  progressText: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0",
  },
  progressPercentage: {
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "center",
    margin: "8px 0 0 0",
  },
  percentage: {
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "right",
    margin: "4px 0 0 0",
  },
  insightsSection: {
    padding: "32px",
    backgroundColor: "#f0f9ff",
  },
  insightsList: {
    spaceY: "16px",
  },
  insightItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  insightIcon: {
    fontSize: "16px",
    flexShrink: 0,
    marginTop: "2px",
  },
  insightText: {
    fontSize: "14px",
    color: "#374151",
    margin: "0",
    lineHeight: "1.5",
  },
  alertBanner: {
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid",
    margin: "16px 0",
  },
  alertText: {
    fontSize: "16px",
    margin: "0",
    textAlign: "center",
    fontWeight: "500",
  },
  ctaSection: {
    padding: "32px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
  },
  ctaButton: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    padding: "12px 32px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "600",
    display: "inline-block",
  },
  negativeCard: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
  },
  positiveCard: {
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
  },
  footer: {
    padding: "24px 32px",
    backgroundColor: "#1f2937",
    textAlign: "center",
  },
  footerText: {
    fontSize: "14px",
    color: "#9ca3af",
    margin: "0 0 8px 0",
    lineHeight: "1.5",
  },
  footerNote: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0",
  },
};
