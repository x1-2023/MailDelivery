#!/usr/bin/env python3
"""
Script to update page.tsx with all improvements:
1. Việt hóa toàn bộ
2. Random button thay vì refresh
3. Donate button ở footer
4. localStorage cho email
5. Pagination
6. Announcement popup control
"""

import re

# Read original file
with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Vietnamese translations map
translations = {
    # Header
    'Temporary Email Service': 'Dịch Vụ Email Tạm Thời',
    'Welcome,': 'Chào mừng,',
    'Admin': 'Quản Trị',
    'Anonymous Mode': 'Chế Độ Ẩn Danh',
    'API Docs': 'Tài Liệu API',
    'Admin Panel': 'Bảng Quản Trị',
    'Logout': 'Đăng Xuất',
    'Login': 'Đăng Nhập',
    
    # Anonymous notice
    "You're using Anonymous Mode": 'Bạn đang sử dụng Chế Độ Ẩn Danh',
    'Your email is temporary and cannot be accessed if you close the browser.': 'Email của bạn chỉ tạm thời và sẽ mất nếu đóng trình duyệt.',
    'Login or Register': 'Đăng Nhập hoặc Đăng Ký',
    'to save your emails and access them from any device.': 'để lưu email và truy cập từ mọi thiết bị.',
    
    # Hero section
    'Temporary Email in Seconds': 'Email Tạm Thời Trong Giây Lát',
    'Get a disposable email address. No registration required.': 'Nhận địa chỉ email dùng một lần. Không cần đăng ký.',
    'Enter custom email (e.g., myname or myname@domain.com)': 'Nhập email tùy chỉnh (vd: tenmoi hoặc tenmoi@domain.com)',
    'Create': 'Tạo',
    'Random': 'Ngẫu Nhiên',
    'Leave empty for random email, or type your custom address': 'Để trống để tạo email ngẫu nhiên, hoặc nhập địa chỉ tùy chỉnh',
    
    # Feature cards
    'Instant Setup': 'Thiết Lập Tức Thì',
    'Get your temporary email in seconds. No registration needed.': 'Nhận email tạm thời trong vài giây. Không cần đăng ký.',
    '100% Anonymous': '100% Ẩn Danh',
    'Protect your privacy. No personal information required.': 'Bảo vệ quyền riêng tư. Không cần thông tin cá nhân.',
    'Auto-Expiring': 'Tự Động Hết Hạn',
    'Emails auto-delete after expiry. Keep your inbox clean.': 'Email tự động xóa sau khi hết hạn. Giữ hộp thư sạch sẽ.',
    
    # Email display
    'Your Temporary Email Addresses:': 'Địa Chỉ Email Tạm Thời Của Bạn:',
    'Active': 'Đang Hoạt Động',
    'Copy': 'Sao Chép',
    'Copied!': 'Đã Sao Chép!',
    'Email address copied to clipboard': 'Đã sao chép địa chỉ email',
    'Copy failed': 'Sao chép thất bại',
    'Please copy manually': 'Vui lòng sao chép thủ công',
    
    # Stats
    'Total Emails': 'Tổng Email',
    'Unread': 'Chưa Đọc',
    'Starred': 'Đánh Dấu Sao',
    
    # Search and filters
    'Search emails...': 'Tìm kiếm email...',
    'Inbox': 'Hộp Thư Đến',
    'No emails yet': 'Chưa có email',
    'Emails sent to your address will appear here.': 'Email gửi đến địa chỉ của bạn sẽ hiển thị ở đây.',
    
    # Email content
    'Select an email to read': 'Chọn một email để đọc',
    'Choose an email from the list to view its contents': 'Chọn email từ danh sách để xem nội dung',
    'Back': 'Quay Lại',
    '(No subject)': '(Không có tiêu đề)',
    
    # Actions
    'Deleted': 'Đã Xóa',
    'Email deleted successfully': 'Đã xóa email thành công',
    'Error': 'Lỗi',
    'Failed to delete email': 'Xóa email thất bại',
    'Failed to create email': 'Tạo email thất bại',
    'Email created!': 'Đã tạo email!',
    'Your email:': 'Email của bạn:',
    
    # Footer
    'Protect your privacy with temporary email addresses.': 'Bảo vệ quyền riêng tư với địa chỉ email tạm thời.',
    
    # New features
    'Donate': 'Ủng Hộ',
    'Support this project': 'Ủng hộ dự án này',
    'Page': 'Trang',
    'Previous': 'Trước',
    'Next': 'Tiếp',
    'Showing': 'Hiển thị',
    'of': 'trong tổng số',
    'emails': 'email',
}

# Apply translations
for en, vi in translations.items():
    # Escape special regex characters
    en_escaped = re.escape(en)
    # Replace in strings (both single and double quotes)
    content = re.sub(f'"{en_escaped}"', f'"{vi}"', content)
    content = re.sub(f"'{en_escaped}'", f"'{vi}'", content)

# Write updated file
with open('app/page.tsx.new', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Created app/page.tsx.new with Vietnamese translations")
print("⚠️  Manual changes still needed:")
print("   1. Replace refresh button with random button")
print("   2. Add localStorage for email")
print("   3. Add donate button in footer")
print("   4. Add pagination")
print("   5. Backup original: mv app/page.tsx app/page.tsx.bak")
print("   6. Apply new version: mv app/page.tsx.new app/page.tsx")
