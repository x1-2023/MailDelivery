import { SMTPServer } from "smtp-server"
import { simpleParser } from "mailparser"
import { saveIncomingEmail } from "./email-service"
import { checkEmailAgainstFilters } from "./spam-filter-service"

export function createSMTPServer() {
  const server = new SMTPServer({
    secure: false,
    authOptional: true,
    disabledCommands: ["AUTH"],

    onConnect(session: any, callback: any) {
      console.log("SMTP connection from:", session.remoteAddress)
      callback()
    },

    onMailFrom(address: any, session: any, callback: any) {
      console.log("Mail from:", address.address)
      callback()
    },

    onRcptTo(address: any, session: any, callback: any) {
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

    onData(stream: any, session: any, callback: any) {
      let emailData = ""

      stream.on("data", (chunk: any) => {
        emailData += chunk.toString()
      })

      stream.on("end", async () => {
        try {
          const parsed = await simpleParser(emailData)
          const fromAddress = parsed.from?.text || "Unknown"
          const subject = parsed.subject || ""

          // Check against spam filters
          const spamCheck = await checkEmailAgainstFilters(fromAddress, subject)

          if (spamCheck.action === "block") {
            console.log("Email blocked by spam filter:", {
              from: fromAddress,
              subject: subject,
              filter: spamCheck.matchedFilter?.name,
            })
            // Don't save to database, just accept to avoid bounce
            callback()
            return
          }

          // Save email to database
          await saveIncomingEmail({
            from: fromAddress,
            to: parsed.to?.text || "Unknown",
            subject: subject,
            body: parsed.text || "",
            html: parsed.html ? parsed.html.toString() : undefined,
            timestamp: new Date().toISOString(),
            read: false,
            starred: false,
            spamFiltered: spamCheck.isSpam ? 1 : 0,
            autoDeleteAt: spamCheck.autoDeleteAt,
          })

          if (spamCheck.action === "auto_delete") {
            console.log("Email marked for auto-deletion:", {
              from: fromAddress,
              subject: subject,
              deleteAt: spamCheck.autoDeleteAt,
              filter: spamCheck.matchedFilter?.name,
            })
          } else {
            console.log("Email saved:", {
              from: fromAddress,
              to: parsed.to?.text,
              subject: subject,
            })
          }

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

  server.on("error", (err: any) => {
    console.error("SMTP Server error:", err)
  })
}
