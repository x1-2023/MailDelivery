"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QrCode } from "lucide-react"

interface QRCodeGeneratorProps {
  email: string
}

export function QRCodeGenerator({ email }: QRCodeGeneratorProps) {
  const [showQR, setShowQR] = useState(false)

  const generateQRCode = () => {
    // Using QR Server API for simplicity
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(email)}`
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowQR(true)}>
        <QrCode className="h-4 w-4 mr-2" />
        QR Code
      </Button>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for {email}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <img src={generateQRCode() || "/placeholder.svg"} alt="QR Code" className="border rounded" />
            <p className="text-sm text-gray-600 text-center">
              Scan this QR code to quickly share your temporary email address
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
