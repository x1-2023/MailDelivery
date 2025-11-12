"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, Heart } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "announcement-popup-dismissed"

export function AnnouncementPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the popup permanently
    const isDismissed = localStorage.getItem(STORAGE_KEY)
    if (!isDismissed) {
      // Show popup after a short delay for better UX
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
  }

  const handleDontShowAgain = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden border-4 border-yellow-400 dark:border-yellow-600">
        {/* Header - Warning Banner */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 dark:from-yellow-600 dark:via-orange-600 dark:to-red-600 p-6 text-center relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-1 bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center justify-center gap-3 mb-2">
            <AlertTriangle className="h-10 w-10 text-white animate-pulse" />
            <DialogTitle className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
              THÔNG BÁO QUAN TRỌNG
            </DialogTitle>
            <AlertTriangle className="h-10 w-10 text-white animate-pulse" />
          </div>
          <DialogDescription className="text-white/90 text-lg font-semibold">
            Vui lòng đọc kỹ thông tin bên dưới
          </DialogDescription>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 bg-white dark:bg-gray-900">
          {/* Free Service Notice */}
          <div className="bg-red-50 dark:bg-red-950/50 border-2 border-red-400 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-3">
                  🚫 NGHIÊM CẤM MUA BÁN 🚫
                </h3>
                <p className="text-lg font-semibold text-red-800 dark:text-red-300 leading-relaxed">
                  Tất cả email trên website đều là <span className="text-2xl font-black">MIỄN PHÍ</span>
                  <br />
                  Nghiêm cấm hành vi kinh doanh mua bán dưới mọi hình thức!
                </p>
              </div>
            </div>
          </div>

          {/* Donate Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-400 dark:border-green-700 rounded-lg p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="h-8 w-8 text-red-500 animate-pulse" />
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                  Ủng Hộ Dự Án
                </h3>
                <Heart className="h-8 w-8 text-red-500 animate-pulse" />
              </div>
              
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                Nếu anh em yêu quý thì donate vào tài khoản bên dưới
                <br />
                <span className="text-base text-gray-600 dark:text-gray-400">
                  Số tiền donate sẽ dùng để nâng cấp server được mượt và chạy tốt hơn
                </span>
              </p>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border-2 border-green-300 dark:border-green-700">
                  <Image
                    src="/tcb.png"
                    alt="QR Code Techcombank"
                    width={280}
                    height={280}
                    className="rounded-lg"
                    priority
                  />
                </div>
                
                {/* Account Info */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-green-300 dark:border-green-700 w-full max-w-md">
                  <div className="space-y-2 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      NGÂN HÀNG TECHCOMBANK (TCB)
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-wider">
                      662636999999
                    </p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      TRAN VAN CUONG
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                💖 Cảm ơn sự ủng hộ của anh em! 💖
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              size="lg"
              className="flex-1 text-lg font-semibold border-2"
            >
              Đóng
            </Button>
            <Button
              onClick={handleDontShowAgain}
              size="lg"
              className="flex-1 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              Đừng hiển thị lại
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
