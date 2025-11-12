# Announcement Popup Component

## 📋 Mô tả

Component popup thông báo lớn, đẹp hiển thị:
- ⚠️ Cảnh báo nghiêm cấm mua bán email (miễn phí 100%)
- 💖 Thông tin donate để ủng hộ dự án
- 🏦 QR Code Techcombank + Số tài khoản
- 🔒 Lưu lựa chọn "Đừng hiển thị lại" vào localStorage

## ✨ Features

- ✅ Popup lớn, nổi bật với border vàng 4px
- ✅ Header gradient màu cảnh báo (vàng-cam-đỏ)
- ✅ Icons animate (pulse effect)
- ✅ Hiển thị sau 1s khi user vào trang
- ✅ QR Code TCB với thông tin tài khoản
- ✅ 2 nút: "Đóng" và "Đừng hiển thị lại"
- ✅ localStorage để nhớ lựa chọn của user
- ✅ Responsive (mobile + desktop)
- ✅ Dark mode support
- ✅ Backdrop blur effect
- ✅ Smooth animations

## 🎨 UI Design

```
┌─────────────────────────────────────┐
│ ⚠️  THÔNG BÁO QUAN TRỌNG ⚠️         │ <- Gradient header
├─────────────────────────────────────┤
│ 🚫 NGHIÊM CẤM MUA BÁN               │ <- Red alert box
│ Tất cả email MIỄN PHÍ               │
├─────────────────────────────────────┤
│ 💖 Ủng Hộ Dự Án 💖                  │
│ Nếu anh em yêu quý thì donate       │
│                                      │
│    ┌───────────────┐                │
│    │   QR CODE     │                │ <- QR image
│    │   TCB         │                │
│    └───────────────┘                │
│                                      │
│ STK: 662636999999                   │ <- Account info
│ TRAN VAN CUONG                      │
├─────────────────────────────────────┤
│  [Đóng]  [Đừng hiển thị lại]       │ <- Buttons
└─────────────────────────────────────┘
```

## 🚀 Usage

Component đã được tích hợp vào `app/layout.tsx` và sẽ tự động hiển thị.

### Để test lại popup (sau khi đã dismiss):

1. Mở DevTools (F12)
2. Console tab
3. Chạy: `localStorage.removeItem('announcement-popup-dismissed')`
4. Reload trang

### Để tắt popup hoàn toàn:

Xóa hoặc comment out dòng này trong `app/layout.tsx`:
```tsx
<AnnouncementPopup />
```

## 🔧 Customization

### Thay đổi thời gian hiển thị:

File: `components/announcement-popup.tsx`
```tsx
setTimeout(() => {
  setOpen(true)
}, 1000) // <- Đổi số này (ms)
```

### Thay đổi localStorage key:

```tsx
const STORAGE_KEY = "announcement-popup-dismissed" // <- Đổi key này
```

### Thay đổi QR code:

Thay file `/public/tcb.png` bằng ảnh khác (recommend: 280x280px hoặc lớn hơn)

### Thay đổi thông tin tài khoản:

File: `components/announcement-popup.tsx`
```tsx
<p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-wider">
  662636999999 // <- Số tài khoản
</p>
<p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
  TRAN VAN CUONG // <- Tên chủ tài khoản
</p>
```

## 📱 Responsive Behavior

- **Desktop (>640px)**: Full width modal, buttons side-by-side
- **Mobile (<640px)**: Smaller modal, buttons stacked vertically
- **QR Code**: Fixed size 280x280px (responsive container)

## 🎯 User Experience

1. User lần đầu vào site → Popup hiển thị sau 1s
2. User click "Đóng" → Popup đóng, hiển thị lại lần sau
3. User click "Đừng hiển thị lại" → Popup đóng vĩnh viễn (localStorage)
4. User có thể ESC hoặc click backdrop để đóng

## 🔒 localStorage

Key: `announcement-popup-dismissed`
Value: `"true"` (string)

Để reset: `localStorage.removeItem('announcement-popup-dismissed')`

## 📦 Dependencies

- `next/image` - Optimize QR code image
- `lucide-react` - Icons (X, AlertTriangle, Heart)
- `@/components/ui/dialog` - shadcn Dialog component
- `@/components/ui/button` - shadcn Button component

## 🎨 Colors Used

- Warning: Yellow-400/600, Orange-400/600, Red-500/600
- Donate: Green-50 to Emerald-50, Green-400/700
- Buttons: Blue-600 to Purple-600 gradient
- Border: Yellow-400 (4px thick)

## 🐛 Troubleshooting

**Popup không hiển thị:**
- Check localStorage: `localStorage.getItem('announcement-popup-dismissed')`
- Check file tcb.png có trong `/public/` chưa
- Check console có lỗi không

**QR Code không hiển thị:**
- Verify file path: `/public/tcb.png`
- Check file size (recommend < 500KB)
- Check file format (PNG, JPG, WebP)

**Dark mode không đúng:**
- Verify theme provider trong `app/layout.tsx`
- Check Tailwind dark mode config

## 📝 Notes

- Popup chỉ hiển thị 1 lần cho mỗi browser (localStorage)
- Clear cache/cookies sẽ hiển thị lại popup
- Incognito mode sẽ luôn hiển thị popup (no localStorage)
