import type { Locale } from "./config";

const uz = {
  nav: {
    about: "About",
    more: "Ko'proq",
    projects: "Loyihalar",
    partners: "Hamkorlar",
    videos: "Videolar",
    home: "Bosh sahifa",
  },
  common: {
    viewAll: "Hammasini ko'rish",
    back: "Orqaga",
    nextProject: "Keyingi loyiha",
    scrollTop: "Tepaga",
    toggleTheme: "Mavzuni almashtirish",
    language: "Til",
    view: "Ko'rish",
    close: "Yopish",
    play: "Videoni ijro etish",
  },
  hero: {
    work: "Ishlarni ko'rish",
    contact: "Bog'lanish",
  },
  sections: {
    selectedWork: "Tanlangan ishlar",
    allProjects: "Barcha loyihalar",
    partners: "Hamkorlar",
    allPartners: "Barcha hamkorlar",
    followMe: "Meni kuzating",
  },
  contact: {
    name: "Ism familiya",
    contact: "Email yoki telefon raqam",
    message: "Xabar",
    submit: "Bog'lanish",
    sending: "Yuborilmoqda…",
    successTitle: "Rahmat!",
    successText: "Xabaringiz yuborildi. Tez orada bog'lanaman.",
    sendAnother: "Yana yozish",
    errors: {
      name: "Ismingizni kiriting",
      contact: "To'g'ri email yoki telefon raqam kiriting",
      message: "Xabar kamida 10 ta belgidan iborat bo'lsin",
      rateLimited: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.",
      generic: "Xatolik yuz berdi. Qayta urinib ko'ring.",
    },
  },
  notFound: {
    title: "Sahifa topilmadi",
    text: "Siz qidirgan sahifa o'chirilgan yoki hech qachon bo'lmagan.",
    home: "Bosh sahifaga qaytish",
  },
  footer: {
    rights: "Barcha huquqlar himoyalangan.",
  },
  portfolio: {
    pickWork: "Ishni tanlang va ichidagi materiallarni ko'ring",
    empty: "Bu bo'limga hali ish qo'shilmagan.",
    works: "Portfolio ishlari",
    openGallery: "Rasmlarni ko'rish uchun markazdagi ishni bosing",
    openPdf: "PDFni ochish uchun markazdagi ishni bosing",
    gallery: "galereya",
    previous: "Oldingi ish",
    next: "Keyingi ish",
  },
  videos: {
    title: "Videolar",
    empty: "Hozircha video qo'shilmagan.",
    feed: "Videolar tasmasi",
    scrollHint: "Pastga aylantiring",
    mute: "Ovozni o'chirish",
    unmute: "Ovozni yoqish",
    pause: "To'xtatish",
    previous: "Oldingi video",
    next: "Keyingi video",
  },
  empty: {
    projects: "Hozircha loyihalar yo'q.",
  },
};

export type Dictionary = typeof uz;

const ru: Dictionary = {
  nav: {
    about: "Обо мне",
    more: "Ещё",
    projects: "Проекты",
    partners: "Партнёры",
    videos: "Видео",
    home: "Главная",
  },
  common: {
    viewAll: "Смотреть все",
    back: "Назад",
    nextProject: "Следующий проект",
    scrollTop: "Наверх",
    toggleTheme: "Сменить тему",
    language: "Язык",
    view: "Смотреть",
    close: "Закрыть",
    play: "Воспроизвести видео",
  },
  hero: {
    work: "Смотреть работы",
    contact: "Связаться",
  },
  sections: {
    selectedWork: "Избранные работы",
    allProjects: "Все проекты",
    partners: "Партнёры",
    allPartners: "Все партнёры",
    followMe: "Подписывайтесь",
  },
  contact: {
    name: "Имя и фамилия",
    contact: "Email или номер телефона",
    message: "Сообщение",
    submit: "Связаться",
    sending: "Отправка…",
    successTitle: "Спасибо!",
    successText: "Сообщение отправлено. Я скоро свяжусь с вами.",
    sendAnother: "Написать ещё",
    errors: {
      name: "Введите имя",
      contact: "Введите корректный email или номер телефона",
      message: "Сообщение должно содержать минимум 10 символов",
      rateLimited: "Слишком много попыток. Попробуйте позже.",
      generic: "Произошла ошибка. Попробуйте ещё раз.",
    },
  },
  notFound: {
    title: "Страница не найдена",
    text: "Страница, которую вы ищете, удалена или никогда не существовала.",
    home: "На главную",
  },
  footer: {
    rights: "Все права защищены.",
  },
  portfolio: {
    pickWork: "Выберите работу, чтобы посмотреть материалы",
    empty: "В этом разделе пока нет работ.",
    works: "Работы портфолио",
    openGallery: "Нажмите на работу в центре, чтобы открыть галерею",
    openPdf: "Нажмите на работу в центре, чтобы открыть PDF",
    gallery: "галерея",
    previous: "Предыдущая работа",
    next: "Следующая работа",
  },
  videos: {
    title: "Видео",
    empty: "Видео пока нет.",
    feed: "Лента видео",
    scrollHint: "Листайте вниз",
    mute: "Выключить звук",
    unmute: "Включить звук",
    pause: "Пауза",
    previous: "Предыдущее видео",
    next: "Следующее видео",
  },
  empty: {
    projects: "Проектов пока нет.",
  },
};

const en: Dictionary = {
  nav: {
    about: "About",
    more: "More",
    projects: "Projects",
    partners: "Partners",
    videos: "Videos",
    home: "Home",
  },
  common: {
    viewAll: "View all",
    back: "Back",
    nextProject: "Next project",
    scrollTop: "Back to top",
    toggleTheme: "Toggle theme",
    language: "Language",
    view: "View",
    close: "Close",
    play: "Play video",
  },
  hero: {
    work: "See my work",
    contact: "Get in touch",
  },
  sections: {
    selectedWork: "Selected work",
    allProjects: "All projects",
    partners: "Partners",
    allPartners: "All partners",
    followMe: "Follow me",
  },
  contact: {
    name: "Full name",
    contact: "Email or phone number",
    message: "Message",
    submit: "Get in touch",
    sending: "Sending…",
    successTitle: "Thank you!",
    successText: "Your message has been sent. I'll get back to you soon.",
    sendAnother: "Send another",
    errors: {
      name: "Please enter your name",
      contact: "Enter a valid email or phone number",
      message: "Message must be at least 10 characters",
      rateLimited: "Too many attempts. Please try again later.",
      generic: "Something went wrong. Please try again.",
    },
  },
  notFound: {
    title: "Page not found",
    text: "The page you are looking for was removed or never existed.",
    home: "Back to home",
  },
  footer: {
    rights: "All rights reserved.",
  },
  portfolio: {
    pickWork: "Select a project to explore its work",
    empty: "No work has been added to this section yet.",
    works: "Portfolio work",
    openGallery: "Select the project in the centre to open its gallery",
    openPdf: "Select the project in the centre to open its PDF",
    gallery: "gallery",
    previous: "Previous project",
    next: "Next project",
  },
  videos: {
    title: "Videos",
    empty: "No videos yet.",
    feed: "Video feed",
    scrollHint: "Scroll down",
    mute: "Mute",
    unmute: "Unmute",
    pause: "Pause",
    previous: "Previous video",
    next: "Next video",
  },
  empty: {
    projects: "No projects yet.",
  },
};

const dictionaries: Record<Locale, Dictionary> = { uz, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
