import {
  CheckCircle2,
  Headphones,
  LifeBuoy,
  Lock,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function LoginHeroShowcase() {
  const highlights = [
    {
      icon: MessageSquare,
      title: "پاسخ‌دهی متنی لحظه‌ای",
      desc: "گفتگوی مستقیم با کارشناسان فنی با قابلیت پیوست فایل و رهگیری سریع",
    },
    {
      icon: ShieldCheck,
      title: "امنیت و تفکیک سازمانی",
      desc: "دسترسی تفکیک‌شده بر اساس گروه‌های کاری سازمانی و احراز هویت امن JWT",
    },
    {
      icon: Zap,
      title: "مدیریت وضعیت و امتیازدهی",
      desc: "پایش لحظه‌ای چرخه عمر تیکت‌ها و ارزیابی کیفیت عملکرد پشتیبانی",
    },
  ];

  return (
    <div className="lg:col-span-7 space-y-6 text-start">
      {/* System Status Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>سامانه پشتیبانی آنلاین و متصل به سرور مرکزی</span>
      </div>

      {/* Main Headline */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            سامانه مدیریت تیکت و پشتیبانی
          </h1>
        </div>
        <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-xl">
          درگاه یکپارچه ثبت درخواست‌ها، پیگیری مشکلات فنی و ارتباط مستقیم میان کاربران و تیم کارشناسان پشتیبانی
        </p>
      </div>

      {/* Capability Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-2 transition-all hover:border-primary/40"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-xs text-foreground">{item.title}</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Trust & Support Badges */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>پایداری بالا و نظارت ۲۴/۷</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-primary" />
          <span>رمزنگاری امن تبادل اطلاعات</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Headphones className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>پشتیبانی چندسطحی سازمانی</span>
        </span>
      </div>
    </div>
  );
}
