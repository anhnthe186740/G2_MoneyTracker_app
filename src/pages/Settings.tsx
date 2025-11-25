import { Bell, Globe, Moon, Sun } from 'lucide-react';

export default function Settings() {
  return (
    <section className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl text-foreground mb-2">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground">Tùy chỉnh giao diện và hành vi ứng dụng</p>
      </div>

      <div className="space-y-6">
        <div >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sun className="w-4 h-4" />
            <span>Giao diện</span>
          </div>
          <strong className="text-xl text-foreground">Chế độ hiển thị</strong>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              className="flex w-full flex-col rounded-xl border-2 border-blue-500 bg-blue-50 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 font-semibold text-blue-600">
                <Sun className="w-5 h-5" />
                Chế độ sáng
              </span>
              <span className="text-sm text-muted-foreground">Tông màu sáng, sắc nét</span>
            </button>

            <button
              type="button"
              className="flex w-full flex-col rounded-xl border border-border px-4 py-3 text-left hover:border-blue-400"
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <Moon className="w-5 h-5" />
                Chế độ tối
              </span>
              <span className="text-sm text-muted-foreground">Tối giản, dịu mắt ban đêm</span>
            </button>
          </div>
        </div>

        <div >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>Ngôn ngữ &amp; Tiền tệ</span>
          </div>
          <strong className="text-xl text-foreground">Tùy chọn hiển thị</strong>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-muted-foreground">
              <span>Ngôn ngữ</span>
              <select id="language" defaultValue="vi" >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-muted-foreground">
              <span>Đơn vị tiền tệ</span>
              <select id="currency" defaultValue="VND">
                <option value="VND">VNĐ (Việt Nam Đồng)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </label>
          </div>
        </div>

        <div >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="w-4 h-4" />
            <span>Thông báo</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground"
        >
          Đặt lại
        </button>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Lưu thay đổi
        </button>
      </div>
    </section>
  );
}