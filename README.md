****Ứng dụng quản lý tài chính cá nhân****

Cách lấy code + chạy lần đầu (chỉ làm 1 lần):

1. Clone repo:
   git clone https://github.com/anhnthe186740/G2_MoneyTracker_app.git
   cd G2_MoneyTracker_app

2. Chuyển sang nhánh develop (quan trọng!):
   git checkout develop
   git pull origin develop

3. Cài dependencies:
   npm install

4. Chạy project:
   npm run dev

Quy tắc làm việc:

1. Luôn pull develop mới nhất:
   git checkout develop
   git pull origin develop

2. Tạo nhánh mới cho chức năng mình làm (không được code trên nhánh develop) :
   git checkout -b feature/tên-chức-năng
   (ví dụ: feature/dashboard, feature/transactions, feature/wallets...)

3. Code xong → commit + push nhánh của mình
   git add .
   git commit -m "feat: mô tả ngắn"
   git push origin feature/tên-chức-năng

4. Vào GitHub tạo Pull Request merge vào develop
5. Tag người khác review → merge → xóa nhánh
6. Nhánh main sẽ để đến khi nào xong dự án trưởng nhóm sẽ merge từ nhánh develop sang để nộp
