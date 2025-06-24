import { SMTPServer } from "smtp-server"
import { simpleParser } from "mailparser"
import { saveIncomingEmail } from "./email-service"

export function createSMTPServer() {
  const server = new SMTPServer({
    secure: false,
    authOptional: true,
    disabledCommands: ["AUTH"],

    onConnect(session, callback) {
      console.log("SMTP connection from:", session.remoteAddress)
      callback()
    },

    onMailFrom(address, session, callback) {
      console.log("Mail from:", address.address)
      callback()
    },

    onRcptTo(address, session, callback) {
      const domains = process.env.DOMAINS?.split(",") || ["tempmail.local"]
      const emailDomain = address.address.split("@")[1]

      if (!domains.includes(emailDomain)) {
        if (process.env.DISCARD_UNKNOWN !== "false") {
          return callback(new Error("Domain not accepted"))
        }
      }

      console.log("Mail to:", address.address)
      callback()
    },

    onData(stream, session, callback) {
      let emailData = ""

      stream.on("data", (chunk) => {
        emailData += chunk.toString()
      })

      stream.on("end", async () => {
        try {
          const parsed = await simpleParser(emailData)

          // Save email to database
          await saveIncomingEmail({
            from: parsed.from?.text || "Unknown",
            to: parsed.to?.text || "Unknown",
            subject: parsed.subject || "",
            body: parsed.text || "",
            html: parsed.html ? parsed.html.toString() : undefined,
            timestamp: new Date().toISOString(),
            read: false,
            starred: false,
          })

          console.log("Email saved:", {
            from: parsed.from?.text,
            to: parsed.to?.text,
            subject: parsed.subject,
          })

          callback()
        } catch (error) {
          console.error("Error processing email:", error)
          callback(error as Error)
        }
      })
    },
  })

  return server
}

// Start SMTP server if this file is run directly
if (require.main === module) {
  const server = createSMTPServer()

  server.listen(25, () => {
    console.log("SMTP Server listening on port 25")
  })

  server.on("error", (err) => {
    console.error("SMTP Server error:", err)
  })
}
