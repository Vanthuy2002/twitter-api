# Flow refresh_token

1. Gửi lên refresh_token cũ của người dùng
2. Decoded qua middlerware
3. Tìm trong db token đó - xóa nó
4. Tạo refresh_token mới ,access_token mới, trả về cho người dùng
