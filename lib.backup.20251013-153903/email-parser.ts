import { simpleParser, type ParsedMail } from "mailparser"

export interface ParsedEmail {
  from: string
  to: string
  subject: string
  text: string
  html?: string
}

export async function parseEmail(rawEmail: string): Promise<ParsedEmail> {
  try {
    const parsed: ParsedMail = await simpleParser(rawEmail)

    return {
      from: parsed.from?.text || "Unknown",
      to: parsed.to?.text || "Unknown",
      subject: parsed.subject || "",
      text: parsed.text || "",
      html: parsed.html ? parsed.html.toString() : undefined,
    }
  } catch (error) {
    console.error("Error parsing email:", error)
    throw new Error("Failed to parse email")
  }
}
